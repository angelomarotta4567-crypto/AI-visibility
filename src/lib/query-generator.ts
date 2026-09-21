export type QueryGeneratorInput = {
  name: string;
  segment: "locale" | "ecommerce" | "b2b";
  city: string | null;
  category: string | null;
};

// Template per segmento, allineati alle leve di CLAUDE.md sezione 4 (locale:
// NAP/recensioni/orari; e-commerce: comparazione/recensioni/freshness; b2b:
// autorevolezza/contenuti tecnici). Sono un punto di partenza da rivedere e
// modificare per cliente, non query definitive: l'utente le edita/rimuove
// prima di attivare il set (vincolo di versionamento, mai query non
// revisionate dal cliente finale).
function localeTemplates(category: string, cityClause: string, name: string): string[] {
  return [
    `miglior ${category}${cityClause}`,
    `quale ${category} scegliere${cityClause}`,
    `dove trovare ${category}${cityClause}`,
    `${category}${cityClause} recensioni`,
    `prezzi ${category}${cityClause}`,
    `${name} recensioni`,
    `${name} orari apertura`,
    `alternative a ${name}${cityClause}`,
    `${category} vicino a me${cityClause}`,
    `orario di apertura ${category}${cityClause}`,
    `${category} di qualità${cityClause}`,
    `${name} indirizzo e contatti`,
  ];
}

function ecommerceTemplates(category: string, name: string): string[] {
  return [
    `miglior negozio online per ${category}`,
    `dove comprare ${category} online`,
    `prezzi ${category} online`,
    `recensioni ${name}`,
    `${name} è affidabile`,
    `confronto prezzi ${category}`,
    `migliori siti per comprare ${category}`,
    `${category} con spedizione veloce`,
    `alternative a ${name}`,
    `${name} spedizioni e tempi di consegna`,
    `${category} offerte e sconti`,
    `${name} recensioni clienti`,
  ];
}

function b2bTemplates(category: string, name: string): string[] {
  return [
    `migliori fornitori di ${category} in Italia`,
    `aziende leader in ${category}`,
    `${name} recensioni clienti`,
    `confronto ${name} e concorrenti`,
    `${category} per aziende: come scegliere`,
    `chi sono i principali player nel settore ${category}`,
    `${name} è un fornitore affidabile`,
    `alternative a ${name} per ${category}`,
    `case study ${category}`,
    `prezzi ${category} per aziende`,
    `${name} referenze e casi studio`,
    `${category} B2B: fornitori consigliati`,
  ];
}

const SEGMENT_FALLBACK_CATEGORY: Record<QueryGeneratorInput["segment"], string> = {
  locale: "attività",
  ecommerce: "negozio online",
  b2b: "fornitore",
};

/** Genera 10-15 query italiane suggerite per un cliente, da rivedere e
 * modificare manualmente prima di attivare il set (mai usate as-is su un
 * cliente reale senza revisione). */
export function generateQuerySuggestions({ name, segment, city, category }: QueryGeneratorInput): string[] {
  const cat = category?.trim().toLowerCase() || SEGMENT_FALLBACK_CATEGORY[segment];
  const cityClause = city?.trim() ? ` a ${city.trim()}` : "";

  const raw =
    segment === "locale"
      ? localeTemplates(cat, cityClause, name)
      : segment === "ecommerce"
        ? ecommerceTemplates(cat, name)
        : b2bTemplates(cat, name);

  return [...new Set(raw.map((q) => q.trim()))].slice(0, 15);
}
