"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, ProgressBar, Badge } from "@/components/ds";
import { processMeasurementCycleChunkAction } from "../../measurement-actions";
import { ENGINE_LABEL } from "@/lib/status-labels";

/** Guida un ciclo "running" attraverso i suoi blocchi finché non è completo
 * (vedi run-cycle.ts per il perché dell'esecuzione a blocchi). Riaprire
 * questa pagina su un ciclo lasciato a metà lo riprende automaticamente,
 * perché il progresso vive nel DB, non in questo componente. */
export function CycleProgressRunner({
  clientId,
  cycleId,
  initialTotal,
  initialProcessed,
}: {
  clientId: string;
  cycleId: string;
  initialTotal: number | null;
  initialProcessed: number;
}) {
  const router = useRouter();
  const [total, setTotal] = useState(initialTotal);
  const [processed, setProcessed] = useState(initialProcessed);
  const [skippedEngines, setSkippedEngines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Niente guardia "già partito" via ref: sotto React Strict Mode (dev) React
  // monta/pulisce/rimonta l'effetto una volta per aiutare a scovare bug come
  // questo. Una guardia persistente bloccherebbe il SECONDO montaggio (quello
  // che sopravvive) mentre il primo, già annullato, si limita a consumare in
  // silenzio un blocco senza mai aggiornare lo stato -- il ciclo appare
  // fermo per sempre nella UI pur avanzando nel DB. Ogni istanza dell'effetto
  // gestisce la propria cancellazione tramite la chiusura locale.
  useEffect(() => {
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        try {
          const result = await processMeasurementCycleChunkAction(clientId, cycleId);
          if (cancelled) return;
          setTotal(result.totalJobs);
          setProcessed(result.processedJobs);
          setSkippedEngines(result.skippedEngines);
          if (result.done) {
            router.refresh();
            return;
          }
        } catch (err) {
          // Il dettaglio tecnico (spesso in inglese: errori API dei motori,
          // nomi di variabili d'ambiente, nomi di tabelle) resta in console
          // per il debug -- mai mostrato com'è all'utente in demo.
          console.error("[misurazione] blocco fallito:", err);
          if (!cancelled) {
            setError("Si è verificato un problema imprevisto durante la misurazione. Ricarica la pagina per riprovare.");
          }
          return;
        }
      }
    }
    loop();
    return () => {
      cancelled = true;
    };
  }, [clientId, cycleId, router]);

  if (error) {
    return (
      <Card>
        <Badge tone="negative">Misurazione interrotta: {error}</Badge>
      </Card>
    );
  }

  return (
    <Card title="Misurazione in corso" kicker="Ogni query viene eseguita più volte per motore -- può richiedere diversi minuti">
      <ProgressBar value={processed} max={total ?? Math.max(processed, 1)} label={`${processed} / ${total ?? "…"} esecuzioni`} />
      {skippedEngines.length > 0 ? (
        <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          Motori esclusi (non ancora attivati su questo account): {skippedEngines.map((e) => ENGINE_LABEL[e] ?? e).join(", ")}
        </p>
      ) : null}
    </Card>
  );
}
