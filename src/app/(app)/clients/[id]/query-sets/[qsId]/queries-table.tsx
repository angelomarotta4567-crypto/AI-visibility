"use client";

import { Button, DataTable } from "@/components/ds";

type QueryRow = { id: string; text: string; created_at: string };

export function QueriesTable({
  queries,
  deleteAction,
}: {
  queries: QueryRow[];
  deleteAction: (queryId: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        { key: "text", header: "Query" },
        {
          key: "actions",
          header: "",
          align: "right",
          render: (q: QueryRow) => (
            <form action={deleteAction.bind(null, q.id)}>
              <Button type="submit" variant="ghost" size="sm" iconLeft="trash-2" aria-label="Rimuovi query" />
            </form>
          ),
        },
      ]}
      rows={queries}
    />
  );
}
