"use client";

import { Badge, DataTable } from "@/components/ds";

export type RunRow = {
  id: string;
  executedAt: string;
  engineCode: string;
  queryText: string;
  clientProminence: "absent" | "mentioned" | "alternative" | "first_cited";
  citationDomains: string[];
};

const prominenceTone: Record<string, "positive" | "accent" | "warning" | "neutral"> = {
  first_cited: "positive",
  alternative: "accent",
  mentioned: "warning",
  absent: "neutral",
};

const prominenceLabel: Record<string, string> = {
  first_cited: "Citata per prima",
  alternative: "Alternativa",
  mentioned: "Menzionata",
  absent: "Assente",
};

export function RunsTable({ runs }: { runs: RunRow[] }) {
  return (
    <DataTable
      columns={[
        { key: "queryText", header: "Query" },
        { key: "engineCode", header: "Motore" },
        {
          key: "clientProminence",
          header: "Prominence",
          render: (r: RunRow) => (
            <Badge tone={prominenceTone[r.clientProminence]}>{prominenceLabel[r.clientProminence]}</Badge>
          ),
        },
        {
          key: "citationDomains",
          header: "Fonti citate",
          render: (r: RunRow) => (r.citationDomains.length > 0 ? r.citationDomains.join(", ") : "—"),
        },
        {
          key: "executedAt",
          header: "Eseguito alle",
          render: (r: RunRow) => new Date(r.executedAt).toLocaleTimeString("it-IT"),
        },
      ]}
      rows={runs}
    />
  );
}
