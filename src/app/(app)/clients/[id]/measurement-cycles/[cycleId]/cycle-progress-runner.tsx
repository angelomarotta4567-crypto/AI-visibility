"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CircularProgress, Badge } from "@/components/ds";
import { getMeasurementCycleProgressAction } from "../../measurement-actions";

const POLL_MS = 2000;

/** Mostra l'avanzamento di un ciclo "running" leggendolo dal DB ogni paio di
 * secondi -- non esegue più nulla lei stessa. L'esecuzione vera prosegue sul
 * server (vedi /api/measurement/tick), quindi il ciclo continua anche se
 * questa pagina non viene mai aperta o viene chiusa a metà: riaprirla mostra
 * semplicemente lo stato attuale. */
export function CycleProgressRunner({
  cycleId,
  initialTotal,
  initialProcessed,
}: {
  cycleId: string;
  initialTotal: number | null;
  initialProcessed: number;
}) {
  const router = useRouter();
  const [total, setTotal] = useState(initialTotal);
  const [processed, setProcessed] = useState(initialProcessed);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const progress = await getMeasurementCycleProgressAction(cycleId);
        if (cancelled) return;
        setTotal(progress.totalJobs);
        setProcessed(progress.processedJobs);
        if (progress.status !== "running") {
          router.refresh();
          return;
        }
        setTimeout(poll, POLL_MS);
      } catch (err) {
        console.error("[misurazione] lettura avanzamento fallita:", err);
        if (!cancelled) {
          setError("Non riesco a leggere l'avanzamento in questo momento. Ricarica la pagina per riprovare.");
        }
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [cycleId, router]);

  if (error) {
    return (
      <Card>
        <Badge tone="negative">{error}</Badge>
      </Card>
    );
  }

  return (
    <Card title="Misurazione in corso" kicker="Prosegue sul server anche se chiudi questa pagina -- può richiedere diversi minuti">
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-2) 0" }}>
        <CircularProgress
          value={processed}
          max={total ?? Math.max(processed, 1)}
          size={112}
          label={`${processed} / ${total ?? "…"} esecuzioni`}
        />
      </div>
    </Card>
  );
}
