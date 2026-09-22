"use client";

import { useRouter } from "next/navigation";
import { Badge, DataTable } from "@/components/ds";
import { SEGMENT_LABEL } from "@/lib/segments";
import { MEASUREMENT_CYCLE_STATUS_LABEL } from "@/lib/status-labels";

export type MisurazioneRow = {
  clientId: string;
  name: string;
  segment: string;
  cycleId: string | null;
  cycleType: string | null;
  status: string | null;
  citationRate: number | null;
  shareOfVoice: number | null;
  startedAt: string | null;
};

const cycleTypeLabel: Record<string, string> = { baseline: "Baseline", verification: "Verifica" };
const statusTone: Record<string, "positive" | "accent" | "negative" | "neutral"> = {
  completed: "positive",
  running: "accent",
  failed: "negative",
  pending: "neutral",
};

export function MisurazioneOverviewTable({ rows }: { rows: MisurazioneRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={[
        { key: "name", header: "Cliente" },
        {
          key: "segment",
          header: "Segmento",
          render: (r: MisurazioneRow) => <Badge tone="accent">{SEGMENT_LABEL[r.segment] ?? r.segment}</Badge>,
        },
        {
          key: "cycleType",
          header: "Ultimo ciclo",
          render: (r: MisurazioneRow) => (r.cycleType ? cycleTypeLabel[r.cycleType] ?? r.cycleType : "mai eseguito"),
        },
        {
          key: "status",
          header: "Stato",
          render: (r: MisurazioneRow) =>
            r.status ? (
              <Badge tone={statusTone[r.status] ?? "neutral"}>{MEASUREMENT_CYCLE_STATUS_LABEL[r.status] ?? r.status}</Badge>
            ) : (
              "—"
            ),
        },
        {
          key: "citationRate",
          header: "Tasso di citazione",
          numeric: true,
          render: (r: MisurazioneRow) => (r.citationRate === null ? "—" : `${Math.round(r.citationRate * 100)}%`),
        },
        {
          key: "shareOfVoice",
          header: "Quota di voce AI",
          numeric: true,
          render: (r: MisurazioneRow) => (r.shareOfVoice === null ? "—" : `${Math.round(r.shareOfVoice * 100)}%`),
        },
        {
          key: "startedAt",
          header: "Data",
          render: (r: MisurazioneRow) => (r.startedAt ? new Date(r.startedAt).toLocaleDateString("it-IT") : "—"),
        },
      ]}
      rows={rows}
      onRowClick={(r: MisurazioneRow) => router.push(`/clients/${r.clientId}`)}
    />
  );
}
