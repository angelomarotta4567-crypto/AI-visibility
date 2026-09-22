"use client";

import { useRouter } from "next/navigation";
import { Badge, DataTable } from "@/components/ds";
import { SEGMENT_LABEL } from "@/lib/segments";

export type DiagnosiRow = {
  clientId: string;
  name: string;
  segment: string;
  score: number | null;
  openBlocks: number;
  runAt: string | null;
};

function scoreTone(score: number | null): "positive" | "warning" | "negative" | "neutral" {
  if (score === null) return "neutral";
  if (score >= 70) return "positive";
  if (score >= 40) return "warning";
  return "negative";
}

export function DiagnosiOverviewTable({ rows }: { rows: DiagnosiRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={[
        { key: "name", header: "Cliente" },
        {
          key: "segment",
          header: "Segmento",
          render: (r: DiagnosiRow) => <Badge tone="accent">{SEGMENT_LABEL[r.segment] ?? r.segment}</Badge>,
        },
        {
          key: "score",
          header: "Punteggio recuperabilità",
          numeric: true,
          render: (r: DiagnosiRow) =>
            r.score === null ? (
              <span style={{ color: "var(--text-tertiary)" }}>mai eseguita</span>
            ) : (
              <Badge tone={scoreTone(r.score)} mono>
                {r.score}/100
              </Badge>
            ),
        },
        {
          key: "openBlocks",
          header: "Blocchi aperti",
          numeric: true,
          render: (r: DiagnosiRow) => (r.score === null ? "—" : r.openBlocks),
        },
        {
          key: "runAt",
          header: "Ultima diagnosi",
          render: (r: DiagnosiRow) => (r.runAt ? new Date(r.runAt).toLocaleDateString("it-IT") : "—"),
        },
      ]}
      rows={rows}
      onRowClick={(r: DiagnosiRow) => router.push(`/clients/${r.clientId}`)}
    />
  );
}
