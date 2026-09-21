import type { EngineQueryResult } from "./types";

export type Subject = {
  subjectType: "client" | "competitor";
  competitorId: string | null;
  nameTerms: string[];
  hostnames: string[];
};

export type Mention = {
  subjectType: "client" | "competitor";
  competitorId: string | null;
  prominence: "absent" | "mentioned" | "alternative" | "first_cited";
  rank: number | null;
};

// Case- e accent-insensitive: senza questo, "Perche'" nel testo del motore
// non trova match con un nome cliente scritto "Perché" nei dati anagrafici
// (e viceversa), producendo falsi "assente".
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function earliestIndex(text: string, terms: string[]): number {
  const normalizedText = normalize(text);
  let best = -1;
  for (const term of terms) {
    if (!term.trim()) continue;
    const idx = normalizedText.indexOf(normalize(term));
    if (idx >= 0 && (best === -1 || idx < best)) best = idx;
  }
  return best;
}

/** Maps CLAUDE.md's 4 prominence levels onto two independent signals per
 * subject: was it named in the response prose, and was it (only) present in
 * a grounding citation?
 *   - first_cited: named in prose, earliest among all tracked subjects.
 *   - alternative: named in prose, but not the earliest.
 *   - mentioned: not named in prose, but present in a citation source
 *     (a marginal presence -- exactly what "menzione marginale" describes).
 *   - absent: neither. */
export function classifyMentions(result: EngineQueryResult, subjects: Subject[]): Mention[] {
  const withTextIndex = subjects.map((s) => ({
    subject: s,
    textIndex: earliestIndex(result.responseText, s.nameTerms),
    citationMatch: result.citations.some(
      (c) => c.domain && s.hostnames.some((h) => h && c.domain === h),
    ),
  }));

  const namedInProse = withTextIndex
    .filter((s) => s.textIndex >= 0)
    .sort((a, b) => a.textIndex - b.textIndex);

  const rankBySubject = new Map<(typeof withTextIndex)[number]["subject"], number>();
  namedInProse.forEach((s, i) => rankBySubject.set(s.subject, i + 1));

  return withTextIndex.map(({ subject, citationMatch }) => {
    const rank = rankBySubject.get(subject) ?? null;
    const prominence: Mention["prominence"] =
      rank === 1 ? "first_cited" : rank !== null ? "alternative" : citationMatch ? "mentioned" : "absent";

    return {
      subjectType: subject.subjectType,
      competitorId: subject.competitorId,
      prominence,
      rank,
    };
  });
}
