-- Fase 3 -- Intervento: piano prioritizzato + stato esecuzione.
create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  diagnosis_finding_id uuid references public.diagnosis_findings (id),
  title text not null,
  lever_category text,
  priority int,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'completed', 'verified')),
  assigned_to uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index interventions_client_id_idx on public.interventions (client_id);

create trigger interventions_set_updated_at
  before update on public.interventions
  for each row execute function public.set_updated_at();

alter table public.interventions enable row level security;

create policy "interventions: team members full access" on public.interventions
  for all using (public.is_team_member()) with check (public.is_team_member());

-- Fase 4 -- Verifica onesta: confronto pre/post con sezione limiti obbligatoria.
create table public.verification_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  baseline_cycle_id uuid not null references public.measurement_cycles (id),
  verification_cycle_id uuid not null references public.measurement_cycles (id),
  summary text,
  limits_note text not null default
    'Le risposte dei motori AI non sono deterministiche; il miglioramento è correlato all''intervento ma non ne costituisce prova di causalità diretta sulle vendite.',
  recommendation text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index verification_reports_client_id_idx on public.verification_reports (client_id);

alter table public.verification_reports enable row level security;

create policy "verification_reports: team members full access" on public.verification_reports
  for all using (public.is_team_member()) with check (public.is_team_member());
