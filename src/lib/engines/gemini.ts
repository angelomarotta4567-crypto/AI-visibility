import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { EngineAdapter, EngineCitation, EngineQueryResult } from "./types";

// Alias rather than a pinned version: Gemini deprecates dated model ids
// fairly quickly (gemini-2.0-flash / gemini-2.5-flash are both already gone
// as of this writing) and re-points itself at whatever the current model
// generation is. "flash-lite" specifically: a measurement cycle fires many
// calls per run (RUNS_PER_QUERY x queries x engines), and it was also the
// only alias that wasn't returning 503 "high demand" when this was wired up
// -- "flash-latest" and "pro-latest" were both overloaded at the time.
const MODEL = "gemini-flash-lite-latest";
// 3 concurrent grounded calls at 20s each measurably lost 2/3 runs to timeout
// in practice; 30s gives real-world latency enough room without risking an
// unbounded hang.
const TIMEOUT_MS = 30000;

function domainOf(uri: string): string | null {
  try {
    return new URL(uri).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const BARE_DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/** Google's grounding API never actually populates `web.domain`, and
 * `web.uri` is a `vertexaisearch.cloud.google.com/grounding-api-redirect/...`
 * tracking link rather than the source site -- both are useless for matching
 * a business's own hostname. `web.title` is, in practice, the bare source
 * domain (e.g. "alpescatorebari.com") when grounding is used, so it's the
 * one field worth trusting here; the URI is kept only as a last resort. */
function resolveCitationDomain(web: { uri: string; title?: string | null; domain?: string | null }): string | null {
  if (web.domain && web.domain !== "vertexaisearch.cloud.google.com") return web.domain;
  if (web.title && BARE_DOMAIN_RE.test(web.title.trim())) return web.title.trim().replace(/^www\./, "");
  return domainOf(web.uri);
}

async function query(queryText: string): Promise<EngineQueryResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurata.");

  const ai = new GoogleGenAI({ apiKey });

  // Google Search grounding: senza questo il modello risponde "a memoria" e
  // non cita fonti reali -- il che vanificherebbe la misurazione (CLAUDE.md:
  // i motori answer-engine restituiscono una sintesi con citazioni
  // selezionate, non un completamento generico).
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: queryText,
    config: {
      tools: [{ googleSearch: {} }],
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    },
  });

  const responseText = response.text ?? "";

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const citations: EngineCitation[] = chunks
    .map((c) => c.web)
    .filter((web): web is NonNullable<typeof web> => Boolean(web?.uri))
    .map((web) => ({
      uri: web.uri!,
      title: web.title ?? null,
      domain: resolveCitationDomain({ uri: web.uri!, title: web.title, domain: web.domain }),
    }));

  return {
    responseText,
    citations,
    raw: {
      model: response.modelVersion ?? MODEL,
      finishReason: response.candidates?.[0]?.finishReason ?? null,
      webSearchQueries: response.candidates?.[0]?.groundingMetadata?.webSearchQueries ?? [],
    },
  };
}

export const geminiAdapter: EngineAdapter = {
  code: "gemini",
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  query,
};
