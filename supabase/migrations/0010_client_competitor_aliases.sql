-- Nomi alternativi/varianti per cliente e competitor: la classificazione
-- delle citazioni cercava solo il nome esatto in clients.name / competitors.name,
-- producendo falsi "assente" quando il motore AI cita un'abbreviazione, un nome
-- commerciale diverso dalla ragione sociale, o una variante ortografica.
alter table public.clients
  add column aliases text[] not null default '{}';

alter table public.competitors
  add column aliases text[] not null default '{}';
