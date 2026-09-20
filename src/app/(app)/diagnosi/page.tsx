import { createClient } from "@/lib/supabase/server";
import { AppShell } from "../app-shell";
import { Card } from "@/components/ds";
import { DiagnosiOverviewTable, type DiagnosiRow } from "./overview-table";

export default async function DiagnosiOverviewPage() {
  const supabase = await createClient();

  const [{ data: user }, { data: clients }, { data: runs }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from("clients").select("id, name, segment").order("name"),
    supabase
      .from("diagnosis_runs")
      .select("id, client_id, recoverability_score, run_at")
      .order("run_at", { ascending: false }),
  ]);

  const latestByClient = new Map<string, { id: string; recoverability_score: number; run_at: string }>();
  for (const r of runs ?? []) {
    if (!latestByClient.has(r.client_id)) latestByClient.set(r.client_id, r);
  }

  const latestRunIds = [...latestByClient.values()].map((r) => r.id);
  const { data: findings } =
    latestRunIds.length > 0
      ? await supabase.from("diagnosis_findings").select("diagnosis_run_id, severity").in("diagnosis_run_id", latestRunIds)
      : { data: [] as { diagnosis_run_id: string; severity: string }[] };

  const openBlocksByRun = new Map<string, number>();
  for (const f of findings ?? []) {
    if (f.severity === "opportunita") continue;
    openBlocksByRun.set(f.diagnosis_run_id, (openBlocksByRun.get(f.diagnosis_run_id) ?? 0) + 1);
  }

  const rows: DiagnosiRow[] = (clients ?? []).map((c) => {
    const latest = latestByClient.get(c.id);
    return {
      clientId: c.id,
      name: c.name,
      segment: c.segment,
      score: latest?.recoverability_score ?? null,
      openBlocks: latest ? (openBlocksByRun.get(latest.id) ?? 0) : 0,
      runAt: latest?.run_at ?? null,
    };
  });

  return (
    <AppShell activeKey="diagnosi" userEmail={user?.email ?? null}>
      <div>
        <h1>Diagnosi</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Fase 1 — è recuperabile? Vista d&rsquo;insieme sull&rsquo;ultima diagnosi di ogni cliente.
        </p>
      </div>

      <Card title="Clienti" kicker={`${rows.length} totali`} padding="none">
        {rows.length > 0 ? (
          <DiagnosiOverviewTable rows={rows} />
        ) : (
          <div style={{ padding: "var(--space-6)", color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            Nessun cliente ancora.
          </div>
        )}
      </Card>
    </AppShell>
  );
}
