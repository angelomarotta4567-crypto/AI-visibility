import "server-only";
import type { EngineAdapter } from "./types";
import { geminiAdapter } from "./gemini";
import { openaiAdapter } from "./openai";
import { perplexityAdapter } from "./perplexity";

// Solo i motori con un adapter implementato qui sotto possono essere
// misurati. Copilot non ha ancora un adapter: non esiste un'API consumer
// ufficiale equivalente (CLAUDE.md la elenca esplicitamente come decisione
// aperta -- Azure "Grounding with Bing Search" o automazione dell'interfaccia,
// da validare prima di costruire), quindi il layer di orchestrazione lo salta
// con un motivo chiaro invece di inventare un'integrazione.
const ADAPTERS: Record<string, EngineAdapter> = {
  gemini: geminiAdapter,
  chatgpt: openaiAdapter,
  perplexity: perplexityAdapter,
};

export function getEngineAdapter(code: string): EngineAdapter | null {
  return ADAPTERS[code] ?? null;
}
