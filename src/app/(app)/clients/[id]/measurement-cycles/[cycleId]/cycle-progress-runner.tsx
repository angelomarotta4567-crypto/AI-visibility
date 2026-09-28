"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CircularProgress, Badge } from "@/components/ds";
import { getMeasurementCycleProgressAction, nudgeMeasurementCycleAction } from "../../measurement-actions";

const POLL_MS = 2000;
// La catena server-to-server (vedi /api/measurement/tick) di norma prosegue
// da sola, ma un anello può perdersi in silenzio. Dopo 2 letture di fila
// senza alcun avanzamento diamo una spinta -- solo mentre questa pagina è
// aperta: se è chiusa il ciclo può restare fermo fino alla riapertura, ma
// non è più legato ad averla aperta fin dall'inizio come prima.
const STALL_THRESHOLD = 2;

/** Mostra l'avanzamento di un ciclo "running" leggendolo dal DB ogni paio di
 * secondi -- non esegue più nulla lei stessa (a parte la spinta di scorta
 * sopra). L'esecuzione vera prosegue sul server, quindi il ciclo continua
 * anche se questa pagina non viene mai aperta o viene chiusa a metà. */
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
    let lastProcessed = initialProcessed;
    let stalledPolls = 0;

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

        if (progress.processedJobs === lastProcessed) {
          stalledPolls++;
        } else {
          stalledPolls = 0;
          lastProcessed = progress.processedJobs;
        }
        if (stalledPolls >= STALL_THRESHOLD) {
          stalledPolls = 0;
          nudgeMeasurementCycleAction(cycleId).catch((err) =>
            console.error("[misurazione] spinta di scorta fallita:", err),
          );
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
  }, [cycleId, router, initialProcessed]);

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
