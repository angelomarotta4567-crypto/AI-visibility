export type LeverCategory =
  | "structured_data"
  | "nap_consistency"
  | "reviews"
  | "freshness"
  | "direct_answer_content"
  | "external_authority";

export type Lever = {
  leverCategory: LeverCategory;
  title: string;
  description: string;
};

// Playbook operativi per segmento -- CLAUDE.md sezione 4: cambiano le leve,
// non solo il testo, perché cambia cosa un motore AI considera "autorevole"
// per quel tipo di business.
export const LEVERS_BY_SEGMENT: Record<"locale" | "ecommerce" | "b2b", Lever[]> = {
  locale: [
    {
      leverCategory: "nap_consistency",
      title: "Coerenza NAP su tutte le piattaforme",
      description: "Nome, indirizzo, telefono, categoria, prezzo e orari identici su sito, Google Business Profile, directory di settore e social.",
    },
    {
      leverCategory: "structured_data",
      title: "Dati strutturati LocalBusiness",
      description: "Markup Schema.org LocalBusiness (indirizzo, orari, categoria, range di prezzo) sulla homepage.",
    },
    {
      leverCategory: "reviews",
      title: "Recensioni verificate e recenti",
      description: "Flusso attivo di recensioni recenti su Google Business Profile e piattaforme di settore -- i motori AI le usano come segnale di autorevolezza.",
    },
    {
      leverCategory: "freshness",
      title: "Orari e prezzo sempre aggiornati",
      description: "Nessuna informazione di orario/prezzo obsoleta su nessuna fonte online: è tra i motivi più comuni di esclusione da una risposta AI.",
    },
  ],
  ecommerce: [
    {
      leverCategory: "structured_data",
      title: "Feed prodotto strutturato e coerente",
      description: "Markup Schema.org Product/Offer coerente tra catalogo, feed e pagine prodotto.",
    },
    {
      leverCategory: "direct_answer_content",
      title: "Contenuti comparativi in formato risposta diretta",
      description: "Pagine che rispondono direttamente a query comparative (\"X vs Y\", \"miglior [prodotto] per [uso]\"), non solo pagine promozionali.",
    },
    {
      leverCategory: "reviews",
      title: "Recensioni prodotto aggregate e verificabili",
      description: "Rating aggregato e recensioni verificabili esposti in modo strutturato su ogni pagina prodotto.",
    },
    {
      leverCategory: "freshness",
      title: "Freshness di prezzo e disponibilità",
      description: "Prezzo e disponibilità sempre allineati tra sito e feed -- un'informazione disallineata è un motivo diretto di esclusione.",
    },
  ],
  b2b: [
    {
      leverCategory: "external_authority",
      title: "Autorevolezza da fonti terze",
      description: "Rassegna stampa, citazioni di settore, partnership visibili e verificabili esternamente al sito.",
    },
    {
      leverCategory: "direct_answer_content",
      title: "Contenuti tecnici in formato estraibile",
      description: "Whitepaper e contenuti tecnici strutturati in modo che un motore possa estrarne fatti verificabili, non solo PDF chiusi.",
    },
    {
      leverCategory: "nap_consistency",
      title: "Coerenza tra sito, LinkedIn e fonti di settore",
      description: "Descrizione dell'azienda, competenze e casi d'uso coerenti tra sito, LinkedIn e fonti di settore.",
    },
  ],
};
