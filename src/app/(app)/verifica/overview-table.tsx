"use client";

import { useRouter } from "next/navigation";
import { Badge, DataTable, Delta } from "@/components/ds";
import { SEGMENT_LABEL } from "@/lib/segments";

export type VerificaRow = {
  clientId: string;
  name: string;
  segment: string;
  hasBaseline: boolean;
  hasVerification: boolean;
  citationRateDeltaPct: number | null;
  shareOfVoiceDeltaPct: number | null;
};

export function VerificaOverviewTable({ rows }: { rows: VerificaRow[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={[
        { key: "name", header: "Cliente" },
        {
          key: "segment",
          header: "Segmento",
          render: (r: VerificaRow) => <Badge tone="accent">{SEGMENT_LABEL[r.segment] ?? r.segment}</Badge>,
        },
        {
          key: "status",
          header: "Confronto",
          render: (r: VerificaRow) =>
            !r.hasBaseline ? (
              <span style={{ color: "var(--text-tertiary)" }}>nessuna baseline</span>
            ) : !r.hasVerification ? (
              <span style={{ color: "var(--text-tertiary)" }}>in attesa di verifica</span>
            ) : (
              <span style={{ color: "var(--text-secondary)" }}>baseline vs ultima verifica</span>
            ),
        },
        {
          key: "citationRateDelta",
          header: "Δ tasso di citazione",
          numeric: true,
          render: (r: VerificaRow) => (r.citationRateDeltaPct === null ? "—" : <Delta value={r.citationRateDeltaPct} digits={1} />),
        },
        {
          key: "shareOfVoiceDelta",
          header: "Δ quota di voce",
          numeric: true,
          render: (r: VerificaRow) => (r.shareOfVoiceDeltaPct === null ? "—" : <Delta value={r.shareOfVoiceDeltaPct} digits={1} />),
        },
      ]}
      rows={rows}
      onRowClick={(r: VerificaRow) => router.push(`/clients/${r.clientId}`)}
    />
  );
}
