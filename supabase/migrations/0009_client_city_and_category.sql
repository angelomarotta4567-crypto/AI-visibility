-- Città e categoria merceologica del cliente: usate per generare le query di
-- misurazione (es. "miglior pizzeria a Bologna") e per i playbook locali del
-- CLAUDE.md sezione 4. Testo libero (non enum): la tassonomia delle categorie
-- non è ancora stata decisa, e vincolarla ora bloccherebbe l'inserimento di
-- clienti reali questa settimana.
alter table public.clients
  add column city text,
  add column category text;
