-- Un solo esecutore alla volta per ciclo: senza questo, la catena di tick e la
-- "spinta" della pagina (o due chiamate ravvicinate) leggono lo stesso punto di
-- ripresa, eseguono lo stesso job due volte e sfalsano tutti i successivi,
-- lasciando i motori con un numero diverso di esecuzioni.
alter table public.measurement_cycles add column locked_until timestamptz;
