"use client";

import { Badge, Button, DataTable } from "@/components/ds";
import { LEVER_CATEGORY_LABEL } from "@/lib/status-labels";
import { HOW_TO_FIX } from "@/lib/interventions/how-to-fix";

export type InterventionRow = {
  id: string;
  title: string;
  lever_category: string | null;
  priority: number | null;
  status: "assigned" | "in_progress" | "completed" | "verified";
  updated_at: string;
};

const statusTone: Record<string, "accent" | "warning" | "positive" | "neutral"> = {
  assigned: "accent",
  in_progress: "warning",
  completed: "positive",
  verified: "positive",
};

const statusLabel: Record<string, string> = {
  assigned: "Assegnato",
  in_progress: "In corso",
  completed: "Completato",
  verified: "Verificato",
};

const nextActionLabel: Record<string, string | null> = {
  assigned: "Segna in corso",
  in_progress: "Segna completato",
  completed: "Segna verificato",
  verified: null,
};

export function InterventionsTable({
  interventions,
  advanceAction,
  deleteAction,
}: {
  interventions: InterventionRow[];
  advanceAction: (interventionId: string, currentStatus: string) => Promise<void>;
  deleteAction: (interventionId: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        {
          key: "title",
          header: "Azione",
          render: (r: InterventionRow) => {
            const howToFix = HOW_TO_FIX[r.title];
            return (
              <div>
                <div>{r.title}</div>
                {howToFix ? (
                  <details>
                    <summary style={{ fontSize: "var(--text-xs)", color: "var(--accent-text)", cursor: "pointer" }}>
                      Cosa significa e come si risolve
                    </summary>
                    <div style={{ margin: "var(--space-2) 0 var(--space-1)", display: "flex", flexDirection: "column", gap: "var(--space-2)", maxWidth: 480 }}>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", whiteSpace: "normal" }}>
                        <strong>Cosa significa:</strong> {howToFix.meaning}
                      </p>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", whiteSpace: "normal" }}>
                        <strong>Come si risolve:</strong> {howToFix.fix}
                      </p>
                    </div>
                  </details>
                ) : null}
              </div>
            );
          },
        },
        {
          key: "lever_category",
          header: "Leva",
          render: (r: InterventionRow) => (r.lever_category ? LEVER_CATEGORY_LABEL[r.lever_category] ?? r.lever_category : "—"),
        },
        {
          key: "status",
          header: "Stato",
          render: (r: InterventionRow) => <Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge>,
        },
        {
          key: "actions",
          header: "",
          align: "right",
          render: (r: InterventionRow) => (
            <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
              {nextActionLabel[r.status] ? (
                <form action={advanceAction.bind(null, r.id, r.status)}>
                  <Button type="submit" variant="secondary" size="sm">
                    {nextActionLabel[r.status]}
                  </Button>
                </form>
              ) : null}
              <form action={deleteAction.bind(null, r.id)}>
                <Button type="submit" variant="ghost" size="sm" iconLeft="trash-2" aria-label="Rimuovi intervento" />
              </form>
            </div>
          ),
        },
      ]}
      rows={interventions}
    />
  );
}
