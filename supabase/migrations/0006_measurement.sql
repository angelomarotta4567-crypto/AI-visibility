-- Fase 2/4 -- Misurazione e Verifica (stessa forma, distinte da cycle_type):
-- baseline e verification sono entrambe "misurazioni", ripetute nel tempo.
create table public.measurement_cycles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  query_set_id uuid not null references public.query_sets (id),
  cycle_type text not null check (cycle_type in ('baseline', 'verification')),
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index measurement_cycles_client_id_idx on public.measurement_cycles (client_id);

alter table public.measurement_cycles enable row level security;

create policy "measurement_cycles: team members full access" on public.measurement_cycles
  for all using (public.is_team_member()) with check (public.is_team_member());

-- Una riga per ogni singola esecuzione di una query su un motore. Più righe
-- per la stessa query/motore/ciclo sono come si modella il non-determinismo
-- (vincolo #1 CLAUDE.md): non si confronta mai un singolo run isolato.
create table public.measurement_runs (
  id uuid primary key default gen_random_uuid(),
  measurement_cycle_id uuid not null references public.measurement_cycles (id) on delete cascade,
  query_id uuid not null references public.queries (id),
  engine_code text not null references public.engines (code),
  executed_at timestamptz not null default now(),
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index measurement_runs_cycle_id_idx on public.measurement_runs (measurement_cycle_id);
create index measurement_runs_query_id_idx on public.measurement_runs (query_id);

alter table public.measurement_runs enable row level security;

create policy "measurement_runs: team members full access" on public.measurement_runs
  for all using (public.is_team_member()) with check (public.is_team_member());

-- Per ogni esecuzione, una riga per ogni entita' citata o assente nella
-- risposta: il client e' un soggetto come gli altri (subject_type='client',
-- competitor_id null), il che rende citation_rate e share_of_voice_ai
-- calcolabili con una view invece di colonne ridondanti da tenere
-- sincronizzate. Invariante applicativa: ogni measurement_run deve avere
-- esattamente una riga subject_type='client'.
create table public.measurement_run_mentions (
  id uuid primary key default gen_random_uuid(),
  measurement_run_id uuid not null references public.measurement_runs (id) on delete cascade,
  subject_type text not null check (subject_type in ('client', 'competitor')),
  competitor_id uuid references public.competitors (id),
  prominence text not null check (prominence in ('absent', 'mentioned', 'alternative', 'first_cited')),
  rank int,
  check (
    (subject_type = 'client' and competitor_id is null)
    or (subject_type = 'competitor' and competitor_id is not null)
  )
);

create index measurement_run_mentions_run_id_idx on public.measurement_run_mentions (measurement_run_id);

alter table public.measurement_run_mentions enable row level security;

create policy "measurement_run_mentions: team members full access" on public.measurement_run_mentions
  for all using (public.is_team_member()) with check (public.is_team_member());

-- citation_rate per (cycle, engine): quota di esecuzioni in cui il client e'
-- citato in qualsiasi posizione (prominence <> 'absent').
create view public.measurement_cycle_engine_stats
with (security_invoker = true) as
select
  mr.measurement_cycle_id,
  mr.engine_code,
  count(*) filter (where m.subject_type = 'client') as client_runs,
  count(*) filter (where m.subject_type = 'client' and m.prominence <> 'absent') as client_citations,
  case
    when count(*) filter (where m.subject_type = 'client') = 0 then null
    else (count(*) filter (where m.subject_type = 'client' and m.prominence <> 'absent'))::float
      / count(*) filter (where m.subject_type = 'client')
  end as citation_rate
from public.measurement_runs mr
join public.measurement_run_mentions m on m.measurement_run_id = mr.id
group by mr.measurement_cycle_id, mr.engine_code;

-- share_of_voice_ai per cycle: quota di citazioni del client rispetto al
-- totale citazioni client+competitor nello stesso set di query.
create view public.measurement_cycle_share_of_voice
with (security_invoker = true) as
select
  cycle_id,
  client_cited,
  competitor_cited,
  case
    when (client_cited + competitor_cited) = 0 then null
    else client_cited::float / (client_cited + competitor_cited)
  end as share_of_voice_ai
from (
  select
    mr.measurement_cycle_id as cycle_id,
    count(*) filter (where m.subject_type = 'client' and m.prominence <> 'absent') as client_cited,
    count(*) filter (where m.subject_type = 'competitor' and m.prominence <> 'absent') as competitor_cited
  from public.measurement_runs mr
  join public.measurement_run_mentions m on m.measurement_run_id = mr.id
  group by mr.measurement_cycle_id
) s;
