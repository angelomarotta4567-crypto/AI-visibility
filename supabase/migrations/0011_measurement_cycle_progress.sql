-- Esecuzione a blocchi e riprendibile per le misurazioni (martedì): un ciclo
-- da 15 query x 3 motori x 3 run = 135 chiamate supera qualunque timeout di
-- una singola invocazione serverless. total_jobs/failed_jobs permettono di
-- riprendere un ciclo "running" da dove si era fermato invece di rieseguire
-- tutto da capo o restare bloccati per sempre (vincolo CLAUDE.md #1: mai una
-- singola esecuzione, sempre più run per query).
alter table public.measurement_cycles
  add column total_jobs int,
  add column failed_jobs int not null default 0;
