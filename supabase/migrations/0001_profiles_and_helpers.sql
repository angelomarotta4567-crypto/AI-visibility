-- Profiles: one row per invited team member. A profile's existence is also the
-- access-control whitelist (see is_team_member()) -- revoke access by deleting
-- the profile row, without touching the underlying auth.users record.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any team member can see the team roster (needed for "assigned to" pickers),
-- but can only edit their own row. Inserts happen only via the trigger below.
create policy "profiles: team members can view" on public.profiles
  for select using (public.is_team_member());

create policy "profiles: self update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile whenever a new auth user is created (i.e. when an
-- admin invites someone via the Supabase dashboard). security definer +
-- explicit search_path so it runs with the owner's privileges (bypassing the
-- select/update-only policies above) regardless of who triggers the insert.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Shared RLS predicate reused by every client-scoped table in later
-- migrations: "does the current session belong to an invited team member?".
create function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- Reusable updated_at maintenance trigger for tables that track it.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
