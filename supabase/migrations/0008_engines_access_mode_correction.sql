-- Corregge access_mode: ChatGPT (OpenAI Responses API + tool web_search) e
-- Perplexity (Sonar API, nativamente grounded) hanno entrambi un'API
-- ufficiale -- la seed iniziale li aveva marcati "assisted_interface" per
-- prudenza, prima di verificare concretamente cosa esiste. Copilot resta
-- "assisted_interface": non ha un'API consumer equivalente diretta (CLAUDE.md
-- decisione aperta).
update public.engines set access_mode = 'official_api' where code in ('chatgpt', 'perplexity');
