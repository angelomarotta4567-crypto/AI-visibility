/** Pulls every @type value out of the page's JSON-LD blocks (Schema.org),
 * following @graph arrays and arrays-of-types. Best-effort: malformed JSON-LD
 * blocks are skipped rather than failing the whole check. */
export function extractJsonLdTypes(html: string): string[] {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  const types = new Set<string>();

  const collect = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }
    if (!node || typeof node !== "object") return;

    const obj = node as Record<string, unknown>;
    const t = obj["@type"];
    if (typeof t === "string") types.add(t);
    if (Array.isArray(t)) t.forEach((v) => typeof v === "string" && types.add(v));

    if (Array.isArray(obj["@graph"])) collect(obj["@graph"]);
  };

  for (const match of blocks) {
    try {
      collect(JSON.parse(match[1]));
    } catch {
      // Malformed JSON-LD is itself a signal, but not one worth failing the
      // whole diagnosis over -- it just won't count toward "structured data present".
    }
  }

  return [...types];
}
