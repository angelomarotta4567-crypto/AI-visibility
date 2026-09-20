-- Lookup table for AI answer engines. Adding a new engine is an INSERT, not a
-- migration -- CLAUDE.md is explicit that the set of engines is extendable
-- and must not be assumed fixed in application logic.
create table public.engines (
  code text primary key,
  label text not null,
  access_mode text not null check (access_mode in ('official_api', 'assisted_interface')),
  active boolean not null default true
);

alter table public.engines enable row level security;

create policy "engines: team members can view" on public.engines
  for select using (public.is_team_member());

-- Writes are reserved for the service role (bypasses RLS) -- no write policy
-- is defined for authenticated team members on purpose.

insert into public.engines (code, label, access_mode) values
  ('chatgpt', 'ChatGPT', 'assisted_interface'),
  ('gemini', 'Gemini', 'official_api'),
  ('perplexity', 'Perplexity', 'assisted_interface'),
  ('copilot', 'Copilot', 'assisted_interface');
