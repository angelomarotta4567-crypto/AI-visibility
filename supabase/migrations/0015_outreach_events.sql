-- Conteggio anonimo di visite e prenotazioni dal link/QR di /prenota, per
-- misurare l'imbuto (fogli consegnati -> scansioni -> prenotazioni) senza
-- raccogliere nulla sulle persone: solo tipo di evento, studio e momento.
-- Niente IP, niente user agent, niente cookie.
create table public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('visit', 'booking')),
  studio_id text,
  studio_name text
);

create index outreach_events_studio_idx on public.outreach_events (studio_id, kind, created_at desc);

alter table public.outreach_events enable row level security;

-- Si scrive solo dal server con la service role (che ignora la RLS): nessuna
-- policy di insert. Il team può solo leggere.
create policy "outreach_events: team members can read" on public.outreach_events
  for select using (public.is_team_member());
