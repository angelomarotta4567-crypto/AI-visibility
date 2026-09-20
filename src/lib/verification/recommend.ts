/** Raccomandazione automatica sul ciclo successivo (CLAUDE.md 6.4:
 * continuare, ri-focalizzare le leve, ampliare il set di query). Regole
 * esplicite e leggibili, non un punteggio "magico" -- nello stesso spirito
 * del modulo di prioritizzazione degli interventi. */
export function recommendNextCycle(citationRateDeltaPct: number | null, queryCount: number): string {
  if (citationRateDeltaPct === null) {
    return "Esegui un ciclo di verifica per poter dare una raccomandazione basata sui dati.";
  }
  if (queryCount < 5) {
    return "Amplia il set di query prima del prossimo ciclo: il campione attuale è troppo ridotto per trarre conclusioni solide.";
  }
  if (citationRateDeltaPct > 5) {
    return "Continua il ciclo attuale: gli interventi mostrano un miglioramento misurabile del citation rate.";
  }
  if (citationRateDeltaPct < -5) {
    return "Ri-focalizza le leve: il citation rate è peggiorato rispetto alla baseline. Rivedi diagnosi e interventi in corso prima del prossimo ciclo.";
  }
  return "Variazione contenuta rispetto alla baseline: continua a monitorare e rafforza le leve a priorità più alta prima del prossimo ciclo.";
}
