export type TopSource = { domain: string; count: number; engines: string[] };

type RunLike = { engine_code: string; raw_response: { citations?: { domain?: string | null }[] } | null };

/** Classifica dei domini più citati su un insieme di esecuzioni: il conteggio
 * è "in quante esecuzioni compare almeno una volta", non il numero grezzo di
 * link (un run che cita due pagine dello stesso dominio conta 1, non 2) --
 * è la lettura utile per l'argomento di vendita ("MioDottore compare in 93
 * esecuzioni su 120"), non un conteggio di citazioni isolate. */
export function topCitedDomains(runs: RunLike[], limit = 10): TopSource[] {
  const byDomain = new Map<string, { count: number; engines: Set<string> }>();
  for (const run of runs) {
    const domains = new Set(
      (run.raw_response?.citations ?? []).map((c) => c.domain).filter((d): d is string => Boolean(d)),
    );
    for (const domain of domains) {
      const entry = byDomain.get(domain) ?? { count: 0, engines: new Set<string>() };
      entry.count++;
      entry.engines.add(run.engine_code);
      byDomain.set(domain, entry);
    }
  }
  return [...byDomain.entries()]
    .map(([domain, { count, engines }]) => ({ domain, count, engines: [...engines].sort() }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
