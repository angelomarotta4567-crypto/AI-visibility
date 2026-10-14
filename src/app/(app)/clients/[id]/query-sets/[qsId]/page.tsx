import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/(app)/app-shell";
import { Card, Badge, Button, Input } from "@/components/ds";
import { QueriesTable } from "./queries-table";
import { addQueryAction, deleteQueryAction, activateQuerySetAction, generateQuerySuggestionsAction, duplicateQuerySetAction } from "./actions";
import { QUERY_SET_STATUS_LABEL } from "@/lib/status-labels";

const statusTone: Record<string, "positive" | "accent" | "neutral"> = {
  active: "positive",
  draft: "accent",
  archived: "neutral",
};

export default async function QuerySetDetailPage({
  params,
}: {
  params: Promise<{ id: string; qsId: string }>;
}) {
  const { id, qsId } = await params;
  const supabase = await createClient();

  const [{ data: user }, { data: client }, { data: querySet }, { data: queries }, { count: cyclesCount }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from("clients").select("id, name").eq("id", id).maybeSingle(),
    supabase.from("query_sets").select("*").eq("id", qsId).eq("client_id", id).maybeSingle(),
    supabase.from("queries").select("id, text, created_at").eq("query_set_id", qsId).order("created_at"),
    supabase.from("measurement_cycles").select("id", { count: "exact", head: true }).eq("query_set_id", qsId),
  ]);
  // Un set già usato in una misurazione non si modifica più (CLAUDE.md, vincolo 4): si crea una nuova versione.
  const frozen = (cyclesCount ?? 0) > 0;

  if (!client || !querySet) notFound();

  const addQuery = addQueryAction.bind(null, qsId, id);
  const deleteQuery = deleteQueryAction.bind(null, qsId, id);
  const activateQuerySet = activateQuerySetAction.bind(null, qsId, id);
  const generateSuggestions = generateQuerySuggestionsAction.bind(null, qsId, id);
  const duplicateSet = duplicateQuerySetAction.bind(null, qsId, id);

  return (
    <AppShell activeKey="clienti" userEmail={user?.email ?? null}>
      <div>
        <Link href={`/clients/${id}`} style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          ← {client.name}
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-2)" }}>
          <div>
            <h1>Set di query — v{querySet.version}</h1>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              {queries?.length ?? 0} query · creato il {new Date(querySet.created_at).toLocaleDateString("it-IT")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Badge tone={statusTone[querySet.status] ?? "neutral"}>
              {QUERY_SET_STATUS_LABEL[querySet.status] ?? querySet.status}
            </Badge>
            <form action={duplicateSet}>
              <Button type="submit" variant={frozen ? "primary" : "secondary"} size="sm" iconLeft="copy">
                Crea nuova versione da questa
              </Button>
            </form>
            {querySet.status !== "active" ? (
              <form action={activateQuerySet}>
                <Button type="submit" variant="primary" size="sm" iconLeft="check">
                  Attiva questa versione
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      {frozen ? (
        <Card kicker="Versione bloccata">
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)", maxWidth: "80ch", lineHeight: "var(--leading-normal)" }}>
            Questa versione è già stata usata in {cyclesCount === 1 ? "una misurazione" : `${cyclesCount} misurazioni`}, quindi non si possono più aggiungere o togliere query: cambiarle renderebbe
            il confronto prima/dopo non valido. Per modificare le domande premi <strong>«Crea nuova versione da questa»</strong>: copia le query, le cambi nella copia e la attivi.
            Le misurazioni fatte con questa versione restano com&rsquo;erano; quelle con la nuova versione non saranno confrontabili con le vecchie.
          </p>
        </Card>
      ) : null}

      <Card
        title="Query"
        kicker="Query realistiche per la Fase 2 — Misurazione"
        padding="none"
        actions={
          frozen ? null : (
            <form action={generateSuggestions}>
              <Button type="submit" variant="secondary" size="sm" iconLeft="sparkles">
                Genera suggerimenti
              </Button>
            </form>
          )
        }
      >
        {queries && queries.length > 0 ? (
          <QueriesTable queries={queries} deleteAction={deleteQuery} frozen={frozen} />
        ) : (
          <div style={{ padding: "var(--space-6)", color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            Nessuna query ancora in questa versione.
          </div>
        )}

        {frozen ? null : (
        <form
          action={addQuery}
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "flex-end",
            padding: "var(--space-4)",
            borderTop: "var(--border-width) solid var(--border-subtle)",
          }}
        >
          <Input name="text" placeholder="es. miglior ristorante di pesce a Bari" required style={{ flex: 1 }} />
          <Button type="submit" variant="primary" iconLeft="plus">
            Aggiungi query
          </Button>
        </form>
        )}
      </Card>
    </AppShell>
  );
}
