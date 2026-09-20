import { createClient } from "@/lib/supabase/server";
import { AppShell } from "../app-shell";
import { Card } from "@/components/ds";
import { MisurazioneOverviewTable, type MisurazioneRow } from "./overview-table";

export default async function MisurazioneOverviewPage() {
  const supabase = await createClient();

  const [{ data: user }, { data: clients }, { data: cycles }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from("clients").select("id, name, segment").order("name"),
    supabase
      .from("measurement_cycles")
      .select("id, client_id, cycle_type, status, started_at")
      .order("started_at", { ascending: false }),
  ]);

  const latestByClient = new Map<string, { id: string; cycle_type: string; status: string; started_at: string }>();
  for (const c of cycles ?? []) {
    if (!latestByClient.has(c.client_id)) latestByClient.set(c.client_id, c);
  }

  const latestCycleIds = [...latestByClient.values()].map((c) => c.id);

  const [{ data: engineStats }, { data: sov }] = await Promise.all([
    latestCycleIds.length > 0
      ? supabase.from("measurement_cycle_engine_stats").select("measurement_cycle_id, citation_rate").in("measurement_cycle_id", latestCycleIds)
      : Promise.resolve({ data: [] as { measurement_cycle_id: string; citation_rate: number | null }[] }),
    latestCycleIds.length > 0
      ? supabase.from("measurement_cycle_share_of_voice").select("cycle_id, share_of_voice_ai").in("cycle_id", latestCycleIds)
      : Promise.resolve({ data: [] as { cycle_id: string; share_of_voice_ai: number | null }[] }),
  ]);

  const citationRateByCycle = new Map<string, number[]>();
  for (const s of engineStats ?? []) {
    if (s.citation_rate === null) continue;
    const arr = citationRateByCycle.get(s.measurement_cycle_id) ?? [];
    arr.push(s.citation_rate);
    citationRateByCycle.set(s.measurement_cycle_id, arr);
  }
  const sovByCycle = new Map<string, number | null>();
  for (const s of sov ?? []) sovByCycle.set(s.cycle_id, s.share_of_voice_ai);

  const rows: MisurazioneRow[] = (clients ?? []).map((c) => {
    const latest = latestByClient.get(c.id);
    const rates = latest ? citationRateByCycle.get(latest.id) : undefined;
    const avgRate = rates && rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;

    return {
      clientId: c.id,
      name: c.name,
      segment: c.segment,
      cycleId: latest?.id ?? null,
      cycleType: latest?.cycle_type ?? null,
      status: latest?.status ?? null,
      citationRate: avgRate,
      shareOfVoice: latest ? (sovByCycle.get(latest.id) ?? null) : null,
      startedAt: latest?.started_at ?? null,
    };
  });

  return (
    <AppShell activeKey="misurazione" userEmail={user?.email ?? null}>
      <div>
        <h1>Misurazione</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Fase 2/4 — è citata? Vista d&rsquo;insieme sull&rsquo;ultimo ciclo di misurazione di ogni cliente.
        </p>
      </div>

      <Card title="Clienti" kicker={`${rows.length} totali`} padding="none">
        {rows.length > 0 ? (
          <MisurazioneOverviewTable rows={rows} />
        ) : (
          <div style={{ padding: "var(--space-6)", color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            Nessun cliente ancora.
          </div>
        )}
      </Card>
    </AppShell>
  );
}
