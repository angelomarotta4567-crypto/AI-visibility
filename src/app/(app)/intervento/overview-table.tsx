"use client";

import { useRouter } from "next/navigation";
import { Badge, DataTable } from "@/components/ds";
import { SEGMENT_LABEL } from "@/lib/segments";

export type InterventoRow = {
  clientId: string;
  name: string;
  segment: string;
  assigned: number;
  inProgress: number;
  completed: number;
  verified: number;
};

export function InterventoOverviewTable({ rows }: { rows: InterventoRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={[
        { key: "name", header: "Cliente" },
        {
          key: "segment",
          header: "Segmento",
          render: (r: InterventoRow) => <Badge tone="accent">{SEGMENT_LABEL[r.segment] ?? r.segment}</Badge>,
        },
        {
          key: "open",
          header: "Aperti",
          numeric: true,
          render: (r: InterventoRow) => r.assigned + r.inProgress,
        },
        { key: "completed", header: "Completati", numeric: true, render: (r: InterventoRow) => r.completed },
        { key: "verified", header: "Verificati", numeric: true, render: (r: InterventoRow) => r.verified },
        {
          key: "total",
          header: "Totale",
          numeric: true,
          render: (r: InterventoRow) => r.assigned + r.inProgress + r.completed + r.verified,
        },
      ]}
      rows={rows}
      onRowClick={(r: InterventoRow) => router.push(`/clients/${r.clientId}`)}
    />
  );
}
