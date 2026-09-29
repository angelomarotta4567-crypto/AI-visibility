import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/(app)/app-shell";
import { Card, Badge, Metric } from "@/components/ds";
import { RunsTable, type RunRow } from "./runs-table";
import { CycleProgressRunner } from "./cycle-progress-runner";
import { MEASUREMENT_CYCLE_STATUS_LABEL, ENGINE_LABEL } from "@/lib/status-labels";
import { topCitedDomains, hostnameOf } from "@/lib/engines/top-sources";

// Questa pagina ora legge soltanto: l'esecuzione vera prosegue lato server
// via /api/measurement/tick (che ha il proprio maxDuration), non qui.

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
      supabase.from("clients").select("id, name, website_url").eq("id", id).maybeSingle(),
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

  const topSources = topCitedDomains((runs ?? []) as unknown as RunJoin[]);
  const clientHostname = hostnameOf(client.website_url);

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
          cycleId={cycleId}
          initialTotal={cycle.total_jobs}
          initialProcessed={runRows.length + cycle.failed_jobs}
        />
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(2, (engineStats?.length ?? 0) + 1)}, 1fr)`, gap: "var(--space-4)" }}>
        <Card>
          <Metric
            label="Quota di voce AI"
            value={shareOfVoice?.share_of_voice_ai != null ? `${Math.round(shareOfVoice.share_of_voice_ai * 100)}%` : "—"}
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
              label={`Tasso di citazione · ${ENGINE_LABEL[s.engine_code] ?? s.engine_code}`}
              value={s.citation_rate != null ? `${Math.round(s.citation_rate * 100)}%` : "—"}
              note={`${s.client_citations}/${s.client_runs} esecuzioni con citazione`}
            />
          </Card>
        ))}
      </div>

      {topSources.length > 0 ? (
        <Card title="Fonti più citate" kicker="I 10 domini citati più spesso dai motori AI in questo ciclo">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {topSources.map((s, i) => (
              <div
                key={s.domain}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                  padding: "var(--space-2) 0",
                  borderBottom: i < topSources.length - 1 ? "var(--border-width) solid var(--border-subtle)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{s.domain}</span>
                  {clientHostname && s.domain === clientHostname ? <Badge tone="positive">È il cliente</Badge> : null}
                </div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                  {s.count} esecuzioni · {s.engines.map((e) => ENGINE_LABEL[e] ?? e).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

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
