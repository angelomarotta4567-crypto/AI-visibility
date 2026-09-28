-- Cattura l'ultimo messaggio d'errore di un job fallito, per poter
-- diagnosticare un ciclo bloccato/fallito senza dover andare a cercare nei
-- log di Vercel ogni volta.
alter table public.measurement_cycles add column last_error text;
