import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/(app)/app-shell";
import { Card, Badge, Metric } from "@/components/ds";
import { RunsTable, type RunRow } from "./runs-table";
import { CycleProgressRunner } from "./cycle-progress-runner";
import { MEASUREMENT_CYCLE_STATUS_LABEL } from "@/lib/status-labels";

// Ogni job (una chiamata a un motore) può richiedere fino a ~45s col retry;
// processMeasurementCycleChunkAction esegue un job alla volta (vedi
// run-cycle.ts), ma diamo comunque margine oltre il default della
// piattaforma -- innocuo se il piano non lo consente, viene troncato.
export const maxDuration = 120;

const cycleTypeLabel: Record<string, string> = { baseline: "Baseline", verification: "Verifica" };
const statusTone: Record<string, "positive" | "accent" | "negative" | "neutral"> = {
  completed: "positive",
  running: "accent",
  failed: "negative",
  pending: "neutral",
};

type MentionJoin = {
  subject_type: "client" | "competitor";
  prominence: RunRow["clientProminence"];
};

type RunJoin = {
  id: string;
  executed_at: string;
  engine_code: string;
  raw_response: { citations?: { domain?: string | null }[] } | null;
  queries: { text: string } | { text: string }[] | null;
  measurement_run_mentions: MentionJoin[] | null;
};

function queryTextOf(q: RunJoin["queries"]): string {
  if (!q) return "—";
  return Array.isArray(q) ? (q[0]?.text ?? "—") : q.text;
}

export default async function MeasurementCycleDetailPage({
  params,
}: {
  params: Promise<{ id: string; cycleId: string }>;
}) {
  const { id, cycleId } = await params;
  const supabase = await createClient();

  const [{ data: user }, { data: client }, { data: cycle }, { data: engineStats }, { data: shareOfVoice }, { data: runs }] =
    await Promise.all([
      supabase.auth.getUser().then((r) => ({ data: r.data.user })),
      supabase.from("clients").select("id, name").eq("id", id).maybeSingle(),
      supabase
        .from("measurement_cycles")
        .select("id, cycle_type, status, started_at, completed_at, total_jobs, failed_jobs, query_sets(version)")
        .eq("id", cycleId)
        .eq("client_id", id)
        .maybeSingle(),
      supabase.from("measurement_cycle_engine_stats").select("*").eq("measurement_cycle_id", cycleId),
      supabase.from("measurement_cycle_share_of_voice").select("*").eq("cycle_id", cycleId).maybeSingle(),
      supabase
        .from("measurement_runs")
        .select("id, executed_at, engine_code, raw_response, queries(text), measurement_run_mentions(subject_type, prominence)")
        .eq("measurement_cycle_id", cycleId)
        .order("executed_at"),
    ]);

  if (!client || !cycle) notFound();

  const runRows: RunRow[] = ((runs ?? []) as unknown as RunJoin[]).map((r) => {
    const clientMention = (r.measurement_run_mentions ?? []).find((m) => m.subject_type === "client");
    return {
      id: r.id,
      executedAt: r.executed_at,
      engineCode: r.engine_code,
      queryText: queryTextOf(r.queries),
      clientProminence: clientMention?.prominence ?? "absent",
      citationDomains: [
        ...new Set((r.raw_response?.citations ?? []).map((c) => c.domain).filter((d): d is string => Boolean(d))),
      ],
    };
  });

  const cycleQuerySets = cycle.query_sets as { version: number } | { version: number }[] | null;
  const querySetVersion = Array.isArray(cycleQuerySets) ? cycleQuerySets[0]?.version : cycleQuerySets?.version;

  return (
    <AppShell activeKey="clienti" userEmail={user?.email ?? null}>
      <div>
        <Link href={`/clients/${id}`} style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          ← {client.name}
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-2)" }}>
          <div>
            <h1>
              {cycleTypeLabel[cycle.cycle_type] ?? cycle.cycle_type} — v{querySetVersion ?? "—"}
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              Avviato il {new Date(cycle.started_at).toLocaleString("it-IT")}
              {cycle.completed_at ? ` · completato il ${new Date(cycle.completed_at).toLocaleString("it-IT")}` : ""}
            </p>
          </div>
          <Badge tone={statusTone[cycle.status] ?? "neutral"}>
            {MEASUREMENT_CYCLE_STATUS_LABEL[cycle.status] ?? cycle.status}
          </Badge>
        </div>
      </div>

      {cycle.status === "running" ? (
        <CycleProgressRunner
          clientId={id}
          cycleId={cycleId}
          initialTotal={cycle.total_jobs}
          initialProcessed={runRows.length + cycle.failed_jobs}
        />
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(2, (engineStats?.length ?? 0) + 1)}, 1fr)`, gap: "var(--space-4)" }}>
        <Card>
          <Metric
            label="Share of voice AI"
            value={shareOfVoice?.share_of_voice_ai != null ? shareOfVoice.share_of_voice_ai.toFixed(2) : "—"}
            note={
              shareOfVoice
                ? `${shareOfVoice.client_cited} citazioni cliente vs ${shareOfVoice.competitor_cited} competitor`
                : "nessun dato"
            }
          />
        </Card>
        {(engineStats ?? []).map((s) => (
          <Card key={s.engine_code}>
            <Metric
              label={`Citation rate · ${s.engine_code}`}
              value={s.citation_rate != null ? s.citation_rate.toFixed(2) : "—"}
              note={`${s.client_citations}/${s.client_runs} esecuzioni con citazione`}
            />
          </Card>
        ))}
      </div>

      <Card title="Dettaglio esecuzioni" kicker={`${runRows.length} run · più run per query = misurazione del non-determinismo`} padding="none">
        {runRows.length > 0 ? (
          <RunsTable runs={runRows} />
        ) : (
          <div style={{ padding: "var(--space-6)", color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            Nessuna esecuzione registrata per questo ciclo.
          </div>
        )}
      </Card>

      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>
        Limiti del dato: le risposte dei motori AI non sono deterministiche; ogni query viene eseguita più volte
        nella stessa finestra prima di essere trattata come dato stabile. Nessuna prova diretta di causalità sulle
        vendite.
      </p>
    </AppShell>
  );
}
