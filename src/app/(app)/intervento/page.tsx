import { createClient } from "@/lib/supabase/server";
import { AppShell } from "../app-shell";
import { Card } from "@/components/ds";
import { InterventoOverviewTable, type InterventoRow } from "./overview-table";

export default async function InterventoOverviewPage() {
  const supabase = await createClient();

  const [{ data: user }, { data: clients }, { data: interventions }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from("clients").select("id, name, segment").order("name"),
    supabase.from("interventions").select("client_id, status"),
  ]);

  const countsByClient = new Map<string, { assigned: number; in_progress: number; completed: number; verified: number }>();
  for (const iv of interventions ?? []) {
    const counts = countsByClient.get(iv.client_id) ?? { assigned: 0, in_progress: 0, completed: 0, verified: 0 };
    if (iv.status in counts) counts[iv.status as keyof typeof counts] += 1;
    countsByClient.set(iv.client_id, counts);
  }

  const rows: InterventoRow[] = (clients ?? []).map((c) => {
    const counts = countsByClient.get(c.id) ?? { assigned: 0, in_progress: 0, completed: 0, verified: 0 };
    return {
      clientId: c.id,
      name: c.name,
      segment: c.segment,
      assigned: counts.assigned,
      inProgress: counts.in_progress,
      completed: counts.completed,
      verified: counts.verified,
    };
  });

  return (
    <AppShell activeKey="intervento" userEmail={user?.email ?? null}>
      <div>
        <h1>Intervento</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Fase 3 — quali leve agire? Vista d&rsquo;insieme sugli interventi di ogni cliente.
        </p>
      </div>

      <Card title="Clienti" kicker={`${rows.length} totali`} padding="none">
        {rows.length > 0 ? (
          <InterventoOverviewTable rows={rows} />
        ) : (
          <div style={{ padding: "var(--space-6)", color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            Nessun cliente ancora.
          </div>
        )}
      </Card>
    </AppShell>
  );
}
