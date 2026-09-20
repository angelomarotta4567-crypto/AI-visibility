import "server-only";
import type { EngineAdapter, EngineCitation, EngineQueryResult } from "./types";

// Perplexity ha ritirato la classica Sonar /chat/completions a favore della
// nuova Agent API (/v1/agent, verificato empiricamente il 2026-09-20 -- sia
// il messaggio d'errore della vecchia API sia la documentazione ufficiale
// indicavano un endpoint diverso e sbagliato, "/v1/responses", quindi questa
// forma è stata confermata con una chiamata reale, non presunta dai testi).
const PRESET = "fast";
const TIMEOUT_MS = 30000;

function domainOf(uri: string): string | null {
  try {
    return new URL(uri).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

type AgentOutputItem =
  | { type: "search_results"; results?: { url?: string; title?: string }[] }
  | { type: "message"; content?: { text?: string }[] }
  | { type: string };

async function query(queryText: string): Promise<EngineQueryResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY non configurata.");

  const res = await fetch("https://api.perplexity.ai/v1/agent", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ preset: PRESET, input: queryText }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Perplexity API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data: { model?: string; status?: string; output?: AgentOutputItem[] } = await res.json();
  const output = data.output ?? [];

  const messageItem = output.find((o): o is Extract<AgentOutputItem, { type: "message" }> => o.type === "message");
  const responseText = messageItem?.content?.map((c) => c.text ?? "").join("") ?? "";

  const searchResultsItem = output.find(
    (o): o is Extract<AgentOutputItem, { type: "search_results" }> => o.type === "search_results",
  );
  const citations: EngineCitation[] = (searchResultsItem?.results ?? [])
    .filter((r): r is { url: string; title?: string } => Boolean(r.url))
    .map((r) => ({ uri: r.url, title: r.title ?? null, domain: domainOf(r.url) }));

  return {
    responseText,
    citations,
    raw: { model: data.model ?? null, status: data.status ?? null },
  };
}

export const perplexityAdapter: EngineAdapter = {
  code: "perplexity",
  isConfigured: () => Boolean(process.env.PERPLEXITY_API_KEY),
  query,
};
