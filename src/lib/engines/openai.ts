import "server-only";
import OpenAI from "openai";
import type { EngineAdapter, EngineCitation, EngineQueryResult } from "./types";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 30000;

function domainOf(uri: string): string | null {
  try {
    return new URL(uri).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function query(queryText: string): Promise<EngineQueryResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY non configurata.");

  const client = new OpenAI({ apiKey });

  // web_search: senza questo tool il modello risponde "a memoria" e non cita
  // fonti reali -- stesso motivo per cui l'adapter Gemini usa il grounding
  // Google Search (vedi gemini.ts).
  const response = await client.responses.create(
    {
      model: MODEL,
      input: queryText,
      tools: [{ type: "web_search" }],
    },
    { timeout: TIMEOUT_MS },
  );

  const responseText = response.output_text ?? "";

  const citations: EngineCitation[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type !== "output_text") continue;
      for (const ann of part.annotations ?? []) {
        if (ann.type === "url_citation" && ann.url) {
          citations.push({ uri: ann.url, title: ann.title ?? null, domain: domainOf(ann.url) });
        }
      }
    }
  }

  return {
    responseText,
    citations,
    raw: { model: response.model ?? MODEL, status: response.status ?? null },
  };
}

export const openaiAdapter: EngineAdapter = {
  code: "chatgpt",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  query,
};
