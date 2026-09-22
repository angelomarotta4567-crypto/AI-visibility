import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ds";
import { SEGMENT_LABEL } from "@/lib/segments";
import { ENGINE_LABEL } from "@/lib/status-labels";
import { PrintButton } from "./print-button";

const SEVERITY_LABEL: Record<string, string> = {
  bloccante: "Da correggere subito",
  limitante: "Da migliorare",
  opportunita: "Opportunità",
};
const SEVERITY_TONE: Record<string, "negative" | "warning" | "neutral"> = {
  bloccante: "negative",
  limitante: "warning",
  opportunita: "neutral",
};

function scoreRead(score: number): { label: string; tone: "positive" | "warning" | "negative" } {
  if (score >= 71) return { label: "Il sito è ben messo per l'AI", tone: "positive" };
  if (score >= 41) return { label: "Buona base, ma si può migliorare", tone: "warning" };
  return { label: "Il sito ha diversi ostacoli da correggere", tone: "negative" };
}

export default async function ClientReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: latestDiagnosis }, { data: latestCycle }, { data: competitors }, { data: interventions }] =
    await Promise.all([
      supabase.from("clients").select("id, name, segment, city, category, website_url").eq("id", id).maybeSingle(),
      supabase
        .from("diagnosis_runs")
        .select("id, recoverability_score, run_at, diagnosis_findings(id, title, severity, description)")
        .eq("client_id", id)
        .order("run_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("measurement_cycles")
        .select("id, cycle_type, started_at, query_sets(queries(id))")
        .eq("client_id", id)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("competitors").select("id").eq("client_id", id),
      supabase
        .from("interventions")
        .select("id, title, lever_category, priority, status")
        .eq("client_id", id)
        .order("priority", { ascending: true, nullsFirst: false })
        .limit(5),
    ]);

  if (!client) notFound();

  const [{ data: engineStats }, { data: shareOfVoice }] = await Promise.all([
    latestCycle
      ? supabase.from("measurement_cycle_engine_stats").select("*").eq("measurement_cycle_id", latestCycle.id)
      : Promise.resolve({ data: null }),
    latestCycle
      ? supabase.from("measurement_cycle_share_of_voice").select("*").eq("cycle_id", latestCycle.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const findings = (latestDiagnosis?.diagnosis_findings ?? []) as {
    id: string;
    title: string;
    severity: string;
    description: string | null;
  }[];
  const topFindings = [...findings]
    .sort((a, b) => (a.severity === "bloccante" ? -1 : 1) - (b.severity === "bloccante" ? -1 : 1))
    .slice(0, 3);

  const today = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const scoreInfo = latestDiagnosis ? scoreRead(latestDiagnosis.recoverability_score) : null;
  const hasCompetitors = (competitors?.length ?? 0) > 0;

  return (
    <div data-theme="light" style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div
        className="report-print-hide"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "flex-end",
          gap: "var(--space-3)",
          padding: "var(--space-3) var(--space-6)",
          background: "var(--surface-2)",
          borderBottom: "var(--border-width) solid var(--border-default)",
        }}
      >
        <PrintButton />
      </div>

      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "var(--space-8) var(--space-6) var(--space-10)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
            Report di visibilità AI
          </p>
          <h1 style={{ margin: "var(--space-2) 0 0" }}>{client.name}</h1>
          <p style={{ margin: "var(--space-1) 0 0", color: "var(--text-secondary)" }}>
            {[SEGMENT_LABEL[client.segment] ?? client.segment, client.city, client.category].filter(Boolean).join(" · ")}
            {" — "}
            {today}
          </p>
        </div>

        <Card title="Il sito è pronto per l'AI?" kicker="Fase 1 — Diagnosi tecnica">
          {latestDiagnosis && scoreInfo ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--weight-semibold)" }}>
                  {latestDiagnosis.recoverability_score}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>/100</span>
                <Badge tone={scoreInfo.tone}>{scoreInfo.label}</Badge>
              </div>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                Questo punteggio misura quanto è facile, per un motore come ChatGPT, capire chi è l&rsquo;azienda e cosa
                offre leggendo il suo sito. Più è alto, meglio è.
              </p>
              {topFindings.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {topFindings.map((f) => (
                    <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Badge tone={SEVERITY_TONE[f.severity] ?? "neutral"}>{SEVERITY_LABEL[f.severity] ?? f.severity}</Badge>
                        <strong style={{ fontSize: "var(--text-sm)" }}>{f.title}</strong>
                      </div>
                      {f.description ? (
                        <p style={{ margin: 0, marginLeft: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                          {f.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--text-tertiary)" }}>Diagnosi non ancora eseguita per questa azienda.</p>
          )}
        </Card>

        <Card title="L'azienda viene citata dai motori AI?" kicker="Fase 2 — Misurazione">
          {latestCycle && engineStats && engineStats.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {engineStats.map((s) => {
                const pct = s.citation_rate != null ? Math.round(s.citation_rate * 100) : null;
                return (
                  <div key={s.engine_code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)" }}>{ENGINE_LABEL[s.engine_code] ?? s.engine_code}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                      {pct != null ? `citata nel ${pct}% delle domande` : "nessun dato"}
                      {" "}
                      <span style={{ color: "var(--text-tertiary)" }}>
                        ({s.client_citations}/{s.client_runs})
                      </span>
                    </span>
                  </div>
                );
              })}
              {hasCompetitors && shareOfVoice?.share_of_voice_ai != null ? (
                <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                  Rispetto ai concorrenti monitorati, su 100 citazioni totali circa{" "}
                  <strong style={{ color: "var(--text-primary)" }}>{Math.round(shareOfVoice.share_of_voice_ai * 100)}</strong>{" "}
                  riguardano questa azienda.
                </p>
              ) : null}
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--text-tertiary)" }}>Nessuna misurazione completata ancora per questa azienda.</p>
          )}
        </Card>

        <Card title="Le prossime mosse consigliate" kicker="Fase 3 — Intervento">
          {interventions && interventions.length > 0 ? (
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {interventions.map((iv, i) => (
                <li key={iv.id} style={{ display: "flex", gap: "var(--space-3)", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: "var(--text-sm)" }}>{iv.title}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ margin: 0, color: "var(--text-tertiary)" }}>Nessuna azione ancora suggerita per questa azienda.</p>
          )}
        </Card>

        <Card title="Limiti di questo report" kicker="Da leggere sempre">
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--leading-relaxed)" }}>
            Le risposte dei motori AI cambiano leggermente ogni volta che vengono interrogati: per questo ogni domanda
            viene ripetuta più volte prima di essere considerata un dato affidabile. Un buon risultato in questo
            report è un segnale positivo di visibilità, ma <strong>non è una prova diretta</strong> che porti più
            vendite: nessun servizio di questo tipo può garantirlo, né garantire un posizionamento fisso su un motore
            specifico.
          </p>
        </Card>

        <p style={{ margin: 0, textAlign: "center", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          Report generato il {today}
        </p>
      </div>

      <style>{`
        @media print {
          .report-print-hide { display: none !important; }
          @page { margin: 16mm; }
        }
      `}</style>
    </div>
  );
}
