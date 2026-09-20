import "server-only";
import type { EngineAdapter } from "./types";
import { geminiAdapter } from "./gemini";

// Solo i motori con un adapter implementato qui sotto possono essere
// misurati. chatgpt/perplexity/copilot non hanno ancora un adapter: CLAUDE.md
// elenca esplicitamente "mix API ufficiali vs automazione controllata
// dell'interfaccia" come decisione aperta, quindi il layer di orchestrazione
// li salta con un motivo chiaro invece di inventare un'integrazione.
const ADAPTERS: Record<string, EngineAdapter> = {
  gemini: geminiAdapter,
};

export function getEngineAdapter(code: string): EngineAdapter | null {
  return ADAPTERS[code] ?? null;
}
