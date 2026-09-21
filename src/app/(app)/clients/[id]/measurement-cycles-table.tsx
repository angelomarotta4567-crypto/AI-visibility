"use client";

import { useRouter } from "next/navigation";
import { Badge, DataTable } from "@/components/ds";
import { MEASUREMENT_CYCLE_STATUS_LABEL } from "@/lib/status-labels";

type Cycle = {
  id: string;
  cycle_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  query_sets: { version: number } | { version: number }[] | null;
};

const cycleTypeLabel: Record<string, string> = { baseline: "Baseline", verification: "Verifica" };
const statusTone: Record<string, "positive" | "accent" | "negative" | "neutral"> = {
  completed: "positive",
  running: "accent",
  failed: "negative",
  pending: "neutral",
};

function versionOf(qs: Cycle["query_sets"]): number | null {
  if (!qs) return null;
  return Array.isArray(qs) ? (qs[0]?.version ?? null) : qs.version;
}

export function MeasurementCyclesTable({ clientId, cycles }: { clientId: string; cycles: Cycle[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={[
        { key: "cycle_type", header: "Tipo", render: (c: Cycle) => cycleTypeLabel[c.cycle_type] ?? c.cycle_type },
        { key: "query_set", header: "Set di query", render: (c: Cycle) => `v${versionOf(c.query_sets) ?? "—"}` },
        {
          key: "status",
          header: "Stato",
          render: (c: Cycle) => (
            <Badge tone={statusTone[c.status] ?? "neutral"}>{MEASUREMENT_CYCLE_STATUS_LABEL[c.status] ?? c.status}</Badge>
          ),
        },
        {
          key: "started_at",
          header: "Avviato il",
          render: (c: Cycle) => new Date(c.started_at).toLocaleString("it-IT"),
        },
      ]}
      rows={cycles}
      onRowClick={(c: Cycle) => router.push(`/clients/${clientId}/measurement-cycles/${c.id}`)}
    />
  );
}
