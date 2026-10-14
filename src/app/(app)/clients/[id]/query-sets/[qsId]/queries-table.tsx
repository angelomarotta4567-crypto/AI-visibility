"use client";

import { useState, useTransition } from "react";
import { Button, DataTable } from "@/components/ds";

type QueryRow = { id: string; text: string; created_at: string };

export function QueriesTable({
  queries,
  deleteAction,
  frozen,
}: {
  queries: QueryRow[];
  deleteAction: (queryId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Set già usato in una misurazione: non si modifica più. */
  frozen: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await deleteAction(id);
        if (!res.ok) setError(res.error);
      } catch {
        setError("Non sono riuscito a contattare il server. Riprova tra un minuto.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <>
      {error ? (
        <p role="alert" style={{ margin: 0, padding: "var(--space-3) var(--space-4)", color: "var(--data-negative)", fontSize: "var(--text-sm)" }}>
          {error}
        </p>
      ) : null}
      <DataTable
        columns={[
          { key: "text", header: "Query" },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (q: QueryRow) =>
              frozen ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconLeft="trash-2"
                  aria-label="Rimuovi query"
                  disabled={pendingId === q.id}
                  onClick={() => remove(q.id)}
                />
              ),
          },
        ]}
        rows={queries}
      />
    </>
  );
}
