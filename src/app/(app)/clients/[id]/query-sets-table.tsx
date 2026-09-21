"use client";

import { useRouter } from "next/navigation";
import { Badge, DataTable } from "@/components/ds";
import { QUERY_SET_STATUS_LABEL } from "@/lib/status-labels";

type QuerySet = {
  id: string;
  version: number;
  status: string;
  created_at: string;
  queries: { count: number }[];
};

const statusTone: Record<string, "positive" | "accent" | "neutral"> = {
  active: "positive",
  draft: "accent",
  archived: "neutral",
};

export function ClientQuerySetsTable({ clientId, querySets }: { clientId: string; querySets: QuerySet[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={[
        { key: "version", header: "Versione", render: (qs: QuerySet) => `v${qs.version}` },
        {
          key: "status",
          header: "Stato",
          render: (qs: QuerySet) => (
            <Badge tone={statusTone[qs.status] ?? "neutral"}>{QUERY_SET_STATUS_LABEL[qs.status] ?? qs.status}</Badge>
          ),
        },
        {
          key: "queries",
          header: "Query",
          numeric: true,
          render: (qs: QuerySet) => qs.queries?.[0]?.count ?? 0,
        },
        {
          key: "created_at",
          header: "Creato il",
          render: (qs: QuerySet) => new Date(qs.created_at).toLocaleDateString("it-IT"),
        },
      ]}
      rows={querySets}
      onRowClick={(qs: QuerySet) => router.push(`/clients/${clientId}/query-sets/${qs.id}`)}
    />
  );
}
