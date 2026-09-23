import "server-only";
import { fetchText } from "./http";
import { extractJsonLdTypes } from "./structured-data";
import type { DiagnosisResult, Finding, Severity } from "./types";

// Schema.org types called out explicitly in CLAUDE.md 6.1 as relevant to the
// service's segments (locale / e-commerce / B2B).
const RELEVANT_TYPES = ["LocalBusiness", "Organization", "Product", "FAQPage"];

export const FINDING_PENALTY: Record<Severity, number> = {
  bloccante: 30,
  limitante: 15,
  opportunita: 5,
};

function normalizeUrl(input: string): string {
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

function robotsBlocksEverything(robotsTxt: string): boolean {
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.trim());
  let inWildcardGroup = false;
  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      inWildcardGroup = value === "*";
    } else if (key === "disallow" && inWildcardGroup && value === "/") {
      return true;
    }
  }
  return false;
}

function hasNoindexMeta(html: string): boolean {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

function hasTitleAndDescription(html: string): boolean {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
  const description = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    .exec(html)?.[1]
    ?.trim();
  return Boolean(title) && Boolean(description);
}

function hasVisibleContactInfo(html: string): boolean {
  // Heuristic only: a phone-number-shaped string somewhere in the markup.
  // This is NOT a NAP cross-source consistency check (that needs Google
  // Business Profile / directory data the service doesn't have API access
  // to yet -- see CLAUDE.md's open decisions).
  return /(\+?\d[\d\s().-]{7,}\d)/.test(html);
}

/** Fase 1 -- Diagnosi: audit tecnico leggero (fetch + parsing HTML/JSON-LD,
 * nessun rendering JS) su indicizzabilità e dati strutturati. Non esegue il
 * cross-check NAP su fonti esterne (GBP, directory) -- limite dichiarato,
 * non nascosto: vedi il finding "opportunita" dedicato in fondo. */
export async function runDiagnosis(websiteUrlInput: string): Promise<DiagnosisResult> {
  const url = normalizeUrl(websiteUrlInput);
  const findings: Finding[] = [];

  const home = await fetchText(url);

  if (!home.ok) {
    findings.push({
      title: "Sito non raggiungibile",
      severity: "bloccante",
      description: home.error
        ? `Impossibile contattare ${url}: ${home.error}.`
        : `${url} ha risposto con stato ${home.status}.`,
    });
    return { recoverability_score: 0, findings };
  }

  if (home.elapsedMs > 2000) {
    findings.push({
      title: "Tempo di risposta elevato",
      severity: "opportunita",
      description: `La homepage ha impiegato ${home.elapsedMs}ms a rispondere (soglia consigliata: 2000ms). Tempi lenti penalizzano il crawling e l'indicizzazione.`,
    });
  }

  const robots = await fetchText(new URL("/robots.txt", url).toString());
  if (robots.ok && robotsBlocksEverything(robots.text)) {
    findings.push({
      title: "robots.txt blocca l'intero sito",
      severity: "bloccante",
      description: "robots.txt contiene \"User-agent: * / Disallow: /\": nessun motore può indicizzare il sito.",
    });
  }

  if (hasNoindexMeta(home.text)) {
    findings.push({
      title: "Meta tag noindex sulla homepage",
      severity: "bloccante",
      description: "La homepage espone <meta name=\"robots\" content=\"noindex\">, escludendola esplicitamente dall'indicizzazione.",
    });
  }

  const sitemap = await fetchText(new URL("/sitemap.xml", url).toString());
  if (!sitemap.ok) {
    findings.push({
      title: "Sitemap.xml assente",
      severity: "limitante",
      description: "Nessuna sitemap trovata su /sitemap.xml. Aiuta i crawler a scoprire tutte le pagine rilevanti.",
    });
  }

  const structuredTypes = extractJsonLdTypes(home.text);
  if (structuredTypes.length === 0) {
    findings.push({
      title: "Nessun dato strutturato (JSON-LD)",
      severity: "limitante",
      description: "Nessun blocco <script type=\"application/ld+json\"> trovato in homepage. I motori AI si appoggiano ai dati strutturati per estrarre fatti verificabili sull'azienda.",
    });
  } else if (!structuredTypes.some((t) => RELEVANT_TYPES.includes(t))) {
    findings.push({
      title: "Dati strutturati presenti ma non pertinenti",
      severity: "opportunita",
      description: `Trovati i tipi [${structuredTypes.join(", ")}], nessuno tra quelli attesi per il segmento (${RELEVANT_TYPES.join(", ")}).`,
    });
  }

  if (!hasTitleAndDescription(home.text)) {
    findings.push({
      title: "Title o meta description mancanti",
      severity: "opportunita",
      description: "La homepage non ha un <title> o una meta description compilati: sono tra i segnali testuali più diretti per un motore.",
    });
  }

  if (!hasVisibleContactInfo(home.text)) {
    findings.push({
      title: "Nessun contatto (telefono) visibile in homepage",
      severity: "opportunita",
      description: "Non è stato individuato un numero di telefono nel markup della homepage.",
    });
  }

  findings.push({
    title: "Coerenza NAP su fonti esterne non verificata",
    severity: "opportunita",
    description: "Questa diagnosi controlla solo il sito del cliente. Il confronto NAP con Google Business Profile, directory di settore e social (CLAUDE.md 6.1) richiede integrazioni dati non ancora configurate.",
  });

  const score = Math.max(
    0,
    100 - findings.reduce((sum, f) => sum + FINDING_PENALTY[f.severity], 0),
  );

  return { recoverability_score: score, findings };
}
