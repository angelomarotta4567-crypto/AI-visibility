-- Versionamento del set di query per cliente (vincolo #4 CLAUDE.md): le query
-- possono evolvere ma il confronto storico deve restare comparabile, quindi si
-- crea una nuova versione invece di sovrascrivere quella esistente.
create table public.query_sets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  version int not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (client_id, version)
);

create index query_sets_client_id_idx on public.query_sets (client_id);

alter table public.query_sets enable row level security;

create policy "query_sets: team members full access" on public.query_sets
  for all using (public.is_team_member()) with check (public.is_team_member());

create table public.queries (
  id uuid primary key default gen_random_uuid(),
  query_set_id uuid not null references public.query_sets (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index queries_query_set_id_idx on public.queries (query_set_id);

alter table public.queries enable row level security;

create policy "queries: team members full access" on public.queries
  for all using (public.is_team_member()) with check (public.is_team_member());
