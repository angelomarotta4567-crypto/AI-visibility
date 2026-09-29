import { LEVERS_BY_SEGMENT, type LeverCategory } from "./levers";
import { NO_WEBSITE_FINDING_TITLE } from "@/lib/diagnosis/run";

export type DiagnosisFindingInput = {
  id: string;
  title: string;
  severity: "bloccante" | "limitante" | "opportunita";
  description: string;
};

export type InterventionSuggestion = {
  title: string;
  description: string;
  leverCategory: LeverCategory | "technical_fix";
  priority: number; // 1 = massimo impatto atteso
  diagnosisFindingId: string | null;
};

const MAX_SUGGESTIONS = 5;

// Quando la Diagnosi trova NO_WEBSITE_FINDING_TITLE, il finding stesso non è
// un'azione (è la constatazione "manca il sito") -- queste 3 lo sono, e
// sostituiscono le leve generiche del segmento, che per un'attività senza
// sito non hanno una base su cui applicarsi.
const NO_WEBSITE_INTERVENTIONS: Omit<InterventionSuggestion, "diagnosisFindingId">[] = [
  {
    title: "Sito di una pagina con dati strutturati",
    description:
      "Anche una sola pagina, con markup Schema.org LocalBusiness (o la sotto-categoria specifica, es. Dentist), dà ai motori AI una fonte diretta da citare.",
    leverCategory: "structured_data",
    priority: 1,
  },
  {
    title: "Scheda MioDottore completa",
    description: "Profilo completo (servizi, orari, presentazione) -- è la fonte più citata dai motori AI per i professionisti sanitari.",
    leverCategory: "nap_consistency",
    priority: 1,
  },
  {
    title: "Scheda Google Business completa",
    description: "Orari, categoria, foto e indirizzo compilati per intero su Google Business Profile.",
    leverCategory: "nap_consistency",
    priority: 1,
  },
];

/** Modulo di prioritizzazione (CLAUDE.md 6.3): incrocia i blocchi tecnici
 * aperti dell'ultima Diagnosi con la libreria di leve del segmento per
 * proporre 3-5 azioni. I blocchi tecnici bloccanti/limitanti vengono prima
 * -- sono la causa più diretta di non-citazione -- poi le leve di playbook
 * del segmento non ancora avviate come intervento. Priorità 1 = massimo
 * impatto atteso, puramente basata sulla severità dichiarata dalla
 * Diagnosi: nessun punteggio "magico", resta leggibile e spiegabile. */
export function suggestInterventions(
  segment: "locale" | "ecommerce" | "b2b",
  latestFindings: DiagnosisFindingInput[],
  existingTitles: string[],
): InterventionSuggestion[] {
  const existing = new Set(existingTitles.map((t) => t.trim().toLowerCase()));
  const hasNoWebsite = latestFindings.some((f) => f.title === NO_WEBSITE_FINDING_TITLE);

  const fromFindings: InterventionSuggestion[] = latestFindings
    .filter((f) => f.severity !== "opportunita")
    .filter((f) => f.title !== NO_WEBSITE_FINDING_TITLE)
    .filter((f) => !existing.has(f.title.trim().toLowerCase()))
    .map((f) => ({
      title: f.title,
      description: f.description,
      leverCategory: "technical_fix",
      priority: f.severity === "bloccante" ? 1 : 2,
      diagnosisFindingId: f.id,
    }));

  const fromNoWebsite: InterventionSuggestion[] = hasNoWebsite
    ? NO_WEBSITE_INTERVENTIONS.filter((iv) => !existing.has(iv.title.trim().toLowerCase())).map((iv) => ({
        ...iv,
        diagnosisFindingId: null,
      }))
    : [];

  const fromLevers: InterventionSuggestion[] = hasNoWebsite
    ? []
    : LEVERS_BY_SEGMENT[segment]
        .filter((l) => !existing.has(l.title.trim().toLowerCase()))
        .map((l) => ({
          title: l.title,
          description: l.description,
          leverCategory: l.leverCategory,
          priority: 3,
          diagnosisFindingId: null,
        }));

  return [...fromFindings, ...fromNoWebsite, ...fromLevers].sort((a, b) => a.priority - b.priority).slice(0, MAX_SUGGESTIONS);
}
