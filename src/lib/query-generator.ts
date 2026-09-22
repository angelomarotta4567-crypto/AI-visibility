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
//
// Deliberatamente NESSUNA query nomina il cliente per nome (niente
// "${name} recensioni", "alternative a ${name}" ecc.): una domanda che cita
// già il nome dell'azienda misura "l'AI sa chi sei se te lo chiedo
// direttamente", non "l'AI ti propone quando qualcuno cerca genericamente
// nella tua categoria" -- che è il segnale di visibilità commerciale reale e
// quello che il cliente vuole sapere. Osservato dal vivo su un pilota reale:
// mescolare le due cose gonfia artificialmente il citation rate mostrato.
function localeTemplates(category: string, cityClause: string): string[] {
  return [
    `miglior ${category}${cityClause}`,
    `quale ${category} scegliere${cityClause}`,
    `dove trovare ${category}${cityClause}`,
    `${category}${cityClause} recensioni`,
    `prezzi ${category}${cityClause}`,
    `${category} vicino a me${cityClause}`,
    `orario di apertura ${category}${cityClause}`,
    `${category} di qualità${cityClause}`,
    `consigliami ${category}${cityClause}`,
    `${category} affidabile${cityClause}`,
    `${category} da provare${cityClause}`,
    `${category} con buone recensioni${cityClause}`,
  ];
}

function ecommerceTemplates(category: string): string[] {
  return [
    `miglior negozio online per ${category}`,
    `dove comprare ${category} online`,
    `prezzi ${category} online`,
    `quali sono i migliori negozi online per ${category}`,
    `negozi affidabili per comprare ${category} online`,
    `confronto prezzi ${category}`,
    `migliori siti per comprare ${category}`,
    `${category} con spedizione veloce`,
    `recensioni negozi online per ${category}`,
    `${category} offerte e sconti`,
    `dove conviene comprare ${category} online`,
    `consigli per comprare ${category} online`,
  ];
}

function b2bTemplates(category: string): string[] {
  return [
    `migliori fornitori di ${category} in Italia`,
    `aziende leader in ${category}`,
    `quali fornitori di ${category} scegliere`,
    `confronto fornitori di ${category}`,
    `${category} per aziende: come scegliere`,
    `chi sono i principali player nel settore ${category}`,
    `fornitori di ${category} affidabili`,
    `recensioni fornitori di ${category}`,
    `case study ${category}`,
    `prezzi ${category} per aziende`,
    `referenze e casi studio settore ${category}`,
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
 * cliente reale senza revisione). Tutte generiche/non-brandizzate per
 * design -- vedi commento sopra localeTemplates. */
export function generateQuerySuggestions({ segment, city, category }: QueryGeneratorInput): string[] {
  const cat = category?.trim().toLowerCase() || SEGMENT_FALLBACK_CATEGORY[segment];
  const cityClause = city?.trim() ? ` a ${city.trim()}` : "";

  const raw =
    segment === "locale"
      ? localeTemplates(cat, cityClause)
      : segment === "ecommerce"
        ? ecommerceTemplates(cat)
        : b2bTemplates(cat);

  return [...new Set(raw.map((q) => q.trim()))].slice(0, 15);
}
