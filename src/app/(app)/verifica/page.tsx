import { createClient } from "@/lib/supabase/server";
import { AppShell } from "../app-shell";
import { Card } from "@/components/ds";
import { VerificaOverviewTable, type VerificaRow } from "./overview-table";

export default async function VerificaOverviewPage() {
  const supabase = await createClient();

  const [{ data: user }, { data: clients }, { data: cycles }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from("clients").select("id, name, segment").order("name"),
    supabase
      .from("measurement_cycles")
      .select("id, client_id, cycle_type, status")
      .eq("status", "completed")
      .order("started_at", { ascending: true }),
  ]);

  // Ascending order: the first "baseline" seen per client is the earliest
  // one; each "verification" seen overwrites the previous, so the last one
  // left standing is the most recent -- exactly the pre/post pair Fase 4
  // compares (CLAUDE.md: confronto esplicito prima/dopo).
  const baselineByClient = new Map<string, string>();
  const verificationByClient = new Map<string, string>();
  for (const c of cycles ?? []) {
    if (c.cycle_type === "baseline" && !baselineByClient.has(c.client_id)) baselineByClient.set(c.client_id, c.id);
    if (c.cycle_type === "verification") verificationByClient.set(c.client_id, c.id);
  }

  const relevantCycleIds = [...baselineByClient.values(), ...verificationByClient.values()];

  const [{ data: engineStats }, { data: sov }] = await Promise.all([
    relevantCycleIds.length > 0
      ? supabase.from("measurement_cycle_engine_stats").select("measurement_cycle_id, citation_rate").in("measurement_cycle_id", relevantCycleIds)
      : Promise.resolve({ data: [] as { measurement_cycle_id: string; citation_rate: number | null }[] }),
    relevantCycleIds.length > 0
      ? supabase.from("measurement_cycle_share_of_voice").select("cycle_id, share_of_voice_ai").in("cycle_id", relevantCycleIds)
      : Promise.resolve({ data: [] as { cycle_id: string; share_of_voice_ai: number | null }[] }),
  ]);

  const avgCitationRateByCycle = new Map<string, number>();
  const ratesByCycle = new Map<string, number[]>();
  for (const s of engineStats ?? []) {
    if (s.citation_rate === null) continue;
    const arr = ratesByCycle.get(s.measurement_cycle_id) ?? [];
    arr.push(s.citation_rate);
    ratesByCycle.set(s.measurement_cycle_id, arr);
  }
  for (const [cycleId, rates] of ratesByCycle) {
    avgCitationRateByCycle.set(cycleId, rates.reduce((a, b) => a + b, 0) / rates.length);
  }
  const sovByCycle = new Map<string, number>();
  for (const s of sov ?? []) if (s.share_of_voice_ai !== null) sovByCycle.set(s.cycle_id, s.share_of_voice_ai);

  const rows: VerificaRow[] = (clients ?? []).map((c) => {
    const baselineId = baselineByClient.get(c.id) ?? null;
    const verificationId = verificationByClient.get(c.id) ?? null;

    const baselineRate = baselineId ? avgCitationRateByCycle.get(baselineId) : undefined;
    const verificationRate = verificationId ? avgCitationRateByCycle.get(verificationId) : undefined;
    const baselineSov = baselineId ? sovByCycle.get(baselineId) : undefined;
    const verificationSov = verificationId ? sovByCycle.get(verificationId) : undefined;

    const citationRateDeltaPct =
      baselineRate !== undefined && verificationRate !== undefined ? (verificationRate - baselineRate) * 100 : null;
    const shareOfVoiceDeltaPct =
      baselineSov !== undefined && verificationSov !== undefined ? (verificationSov - baselineSov) * 100 : null;

    return {
      clientId: c.id,
      name: c.name,
      segment: c.segment,
      hasBaseline: Boolean(baselineId),
      hasVerification: Boolean(verificationId),
      citationRateDeltaPct,
      shareOfVoiceDeltaPct,
    };
  });

  return (
    <AppShell activeKey="verifica" userEmail={user?.email ?? null}>
      <div>
        <h1>Verifica</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Fase 4 — è migliorata? Confronto tra la baseline e l&rsquo;ultima verifica di ogni cliente.
        </p>
      </div>

      <Card title="Clienti" kicker={`${rows.length} totali`} padding="none">
        {rows.length > 0 ? (
          <VerificaOverviewTable rows={rows} />
        ) : (
          <div style={{ padding: "var(--space-6)", color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            Nessun cliente ancora.
          </div>
        )}
      </Card>

      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>
        Limiti del dato: le risposte dei motori AI non sono deterministiche; il confronto è correlato agli interventi
        svolti ma non ne costituisce prova di causalità diretta sulle vendite.
      </p>
    </AppShell>
  );
}
