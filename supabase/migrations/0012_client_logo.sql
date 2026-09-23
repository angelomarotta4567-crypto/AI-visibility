-- Logo del cliente (URL a un'immagine già ospitata altrove, es. sul sito del
-- cliente o sui suoi social) -- mostrato accanto al nome nella lista clienti
-- e sulla scheda cliente, per riconoscerlo a colpo d'occhio invece che dal
-- solo nome testuale.
alter table public.clients
  add column logo_url text;
