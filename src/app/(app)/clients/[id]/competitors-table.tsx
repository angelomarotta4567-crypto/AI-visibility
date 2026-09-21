"use client";

import { Button, DataTable } from "@/components/ds";

type Competitor = { id: string; name: string; url: string | null; aliases?: string[] | null };

export function CompetitorsTable({
  competitors,
  deleteAction,
}: {
  competitors: Competitor[];
  deleteAction: (competitorId: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        { key: "name", header: "Nome" },
        {
          key: "aliases",
          header: "Alias",
          render: (c: Competitor) =>
            c.aliases && c.aliases.length > 0 ? (
              <span style={{ color: "var(--text-secondary)" }}>{c.aliases.join(", ")}</span>
            ) : (
              "—"
            ),
        },
        {
          key: "url",
          header: "Sito",
          render: (c: Competitor) =>
            c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer">
                {c.url}
              </a>
            ) : (
              "—"
            ),
        },
        {
          key: "actions",
          header: "",
          align: "right",
          render: (c: Competitor) => (
            <form action={deleteAction.bind(null, c.id)}>
              <Button type="submit" variant="ghost" size="sm" iconLeft="trash-2" aria-label="Rimuovi competitor" />
            </form>
          ),
        },
      ]}
      rows={competitors}
    />
  );
}
