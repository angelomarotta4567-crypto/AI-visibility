import { LEVERS_BY_SEGMENT, type LeverCategory } from "./levers";

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

  const fromFindings: InterventionSuggestion[] = latestFindings
    .filter((f) => f.severity !== "opportunita")
    .filter((f) => !existing.has(f.title.trim().toLowerCase()))
    .map((f) => ({
      title: f.title,
      description: f.description,
      leverCategory: "technical_fix",
      priority: f.severity === "bloccante" ? 1 : 2,
      diagnosisFindingId: f.id,
    }));

  const fromLevers: InterventionSuggestion[] = LEVERS_BY_SEGMENT[segment]
    .filter((l) => !existing.has(l.title.trim().toLowerCase()))
    .map((l) => ({
      title: l.title,
      description: l.description,
      leverCategory: l.leverCategory,
      priority: 3,
      diagnosisFindingId: null,
    }));

  return [...fromFindings, ...fromLevers].sort((a, b) => a.priority - b.priority).slice(0, MAX_SUGGESTIONS);
}
