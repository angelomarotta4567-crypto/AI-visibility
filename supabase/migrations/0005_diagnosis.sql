-- Fase 1 -- Diagnosi ("e' recuperabile?"): Recoverability Score + blocchi tecnici.
create table public.diagnosis_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  recoverability_score int not null check (recoverability_score between 0 and 100),
  run_at timestamptz not null default now(),
  notes text,
  created_by uuid references public.profiles (id)
);

create index diagnosis_runs_client_id_idx on public.diagnosis_runs (client_id);

alter table public.diagnosis_runs enable row level security;

create policy "diagnosis_runs: team members full access" on public.diagnosis_runs
  for all using (public.is_team_member()) with check (public.is_team_member());

create table public.diagnosis_findings (
  id uuid primary key default gen_random_uuid(),
  diagnosis_run_id uuid not null references public.diagnosis_runs (id) on delete cascade,
  title text not null,
  severity text not null check (severity in ('bloccante', 'limitante', 'opportunita')),
  description text
);

create index diagnosis_findings_run_id_idx on public.diagnosis_findings (diagnosis_run_id);

alter table public.diagnosis_findings enable row level security;

create policy "diagnosis_findings: team members full access" on public.diagnosis_findings
  for all using (public.is_team_member()) with check (public.is_team_member());
