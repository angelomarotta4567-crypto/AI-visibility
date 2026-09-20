-- Segmento cliente per CLAUDE.md sezione 4: cambia leve e query, non solo il testo.
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment text not null check (segment in ('locale', 'ecommerce', 'b2b')),
  website_url text,
  notes text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy "clients: team members full access" on public.clients
  for all using (public.is_team_member()) with check (public.is_team_member());

-- Competitor diretti per client, usati per calcolare share_of_voice_ai.
create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  url text,
  created_at timestamptz not null default now()
);

create index competitors_client_id_idx on public.competitors (client_id);

alter table public.competitors enable row level security;

create policy "competitors: team members full access" on public.competitors
  for all using (public.is_team_member()) with check (public.is_team_member());
