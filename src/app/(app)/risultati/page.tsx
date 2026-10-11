import { createClient } from "@/lib/supabase/server";
import { AppShell } from "../app-shell";
import { Card, Metric } from "@/components/ds";

type EventRow = { kind: "visit" | "booking"; studio_id: string | null; studio_name: string | null; created_at: string };

const pct = (num: number, den: number) => (den > 0 ? `${Math.round((num / den) * 100)}%` : "—");

export default async function ResultsPage() {
  const supabase = await createClient();
  const [{ data: userData }, { data: events }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("outreach_events").select("kind, studio_id, studio_name, created_at").order("created_at", { ascending: false }).limit(5000),
  ]);

  const rows = (events ?? []) as EventRow[];
  const visits = rows.filter((r) => r.kind === "visit");
  const bookings = rows.filter((r) => r.kind === "booking");

  // Per studio: l'id arriva dal QR; senza id la visita è un accesso diretto al link generico.
  const byStudio = new Map<string, { name: string; visits: number; bookings: number; last: string }>();
  for (const r of rows) {
    const key = r.studio_id ?? "diretto";
    const cur = byStudio.get(key) ?? { name: r.studio_name || (r.studio_id ? "Studio senza nome" : "Link generico (senza QR)"), visits: 0, bookings: 0, last: r.created_at };
    if (r.kind === "visit") cur.visits++;
    else cur.bookings++;
    if (r.studio_name && !cur.name.startsWith("Link")) cur.name = r.studio_name;
    if (r.created_at > cur.last) cur.last = r.created_at;
    byStudio.set(key, cur);
  }
  const table = [...byStudio.values()].sort((a, b) => b.visits - a.visits);

  return (
    <AppShell activeKey="risultati" userEmail={userData.user?.email ?? null}>
      <div>
        <h1>Risultati del contatto</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)", maxWidth: "70ch" }}>
          Quante persone aprono il link o il QR dei fogli e quante prenotano la chiamata. I fogli consegnati, le
          conversazioni e i clienti paganti si segnano nel Tracker: qui c&rsquo;è solo la parte che il sito può contare da solo.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)" }}>
        <Card><Metric label="Visite al link / QR" value={String(visits.length)} note="persone, escluse anteprime e bot" /></Card>
        <Card><Metric label="Chiamate prenotate" value={String(bookings.length)} note="dal modulo di /prenota" /></Card>
        <Card><Metric label="Da visita a prenotazione" value={pct(bookings.length, visits.length)} note="prenotazioni / visite" /></Card>
        <Card><Metric label="Studi che hanno aperto il link" value={String([...byStudio.keys()].filter((k) => k !== "diretto").length)} note="distinti, dal QR personalizzato" /></Card>
      </div>

      <Card title="Per studio" kicker="Dal QR personalizzato di ogni foglio" padding="none">
        {table.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-tertiary)" }}>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Studio</th>
                  <th style={{ padding: "var(--space-3)" }}>Visite</th>
                  <th style={{ padding: "var(--space-3)" }}>Prenotazioni</th>
                  <th style={{ padding: "var(--space-3)" }}>Tasso</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Ultimo evento</th>
                </tr>
              </thead>
              <tbody>
                {table.map((t) => (
                  <tr key={t.name + t.last} style={{ borderTop: "var(--border-width) solid var(--border-subtle)" }}>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>{t.name}</td>
                    <td style={{ padding: "var(--space-3)", fontFamily: "var(--font-mono)" }}>{t.visits}</td>
                    <td style={{ padding: "var(--space-3)", fontFamily: "var(--font-mono)" }}>{t.bookings}</td>
                    <td style={{ padding: "var(--space-3)", fontFamily: "var(--font-mono)" }}>{pct(t.bookings, t.visits)}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-secondary)" }}>{new Date(t.last).toLocaleString("it-IT")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "var(--space-6)", color: "var(--text-secondary)" }}>
            Ancora nessuna visita registrata. Appena qualcuno scansiona un QR o apre il link, compare qui.
          </div>
        )}
      </Card>

      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)", maxWidth: "80ch" }}>
        Limiti del dato: il conteggio è anonimo (nessun cookie, nessun IP). Chi ricarica la pagina dello stesso studio
        entro 10 minuti conta una volta sola; chi torna in un altro momento conta di nuovo, quindi le visite sono un
        ordine di grandezza e non il numero esatto di persone. Una visita dimostra interesse, non una vendita: la prova
        che il metodo funziona è un pagamento.
      </p>
    </AppShell>
  );
}
