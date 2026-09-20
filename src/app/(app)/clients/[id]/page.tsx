import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "../../app-shell";
import { Card, Badge, Button, Input, Select, Metric } from "@/components/ds";
import { ClientQuerySetsTable } from "./query-sets-table";
import { CompetitorsTable } from "./competitors-table";
import { MeasurementCyclesTable } from "./measurement-cycles-table";
import { InterventionsTable, type InterventionRow } from "./interventions-table";
import { addCompetitorAction, deleteCompetitorAction, createQuerySetAction } from "./actions";
import { runDiagnosisAction } from "./diagnosis-actions";
import { runMeasurementCycleAction } from "./measurement-actions";
import { createInterventionAction, advanceInterventionStatusAction, deleteInterventionAction } from "./interventions-actions";
import { createVerificationReportAction } from "./verification-actions";
import { suggestInterventions } from "@/lib/interventions/suggest";
import { recommendNextCycle } from "@/lib/verification/recommend";
import { SEGMENT_LABEL } from "@/lib/segments";

const severityTone: Record<string, "negative" | "warning" | "neutral"> = {
  bloccante: "negative",
  limitante: "warning",
  opportunita: "neutral",
};

type QuerySet = {
  id: string;
  version: number;
  status: string;
  created_at: string;
  queries: { count: number }[];
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: user },
    { data: client },
    { data: competitors },
    { data: querySets },
    { data: latestDiagnosis },
    { data: measurementCycles },
    { data: interventions },
    { data: verificationReports },
  ] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("competitors").select("id, name, url").eq("client_id", id).order("created_at"),
    supabase
      .from("query_sets")
      .select("id, version, status, created_at, queries(count)")
      .eq("client_id", id)
      .order("version", { ascending: false }),
    supabase
      .from("diagnosis_runs")
      .select("id, recoverability_score, run_at, diagnosis_findings(id, title, severity, description)")
      .eq("client_id", id)
      .order("run_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("measurement_cycles")
      .select("id, cycle_type, status, started_at, completed_at, query_set_id, query_sets(version)")
      .eq("client_id", id)
      .order("started_at", { ascending: false }),
    supabase
      .from("interventions")
      .select("id, title, lever_category, priority, status, updated_at")
      .eq("client_id", id)
      .order("priority", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false }),
    supabase
      .from("verification_reports")
      .select("id, summary, recommendation, limits_note, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  const deleteCompetitor = deleteCompetitorAction.bind(null, id);
  const addCompetitor = addCompetitorAction.bind(null, id);
  const createQuerySet = createQuerySetAction.bind(null, id);
  const runDiagnosis = runDiagnosisAction.bind(null, id);
  const runMeasurement = runMeasurementCycleAction.bind(null, id);
  const createIntervention = createInterventionAction.bind(null, id);
  const advanceIntervention = advanceInterventionStatusAction.bind(null, id);
  const deleteIntervention = deleteInterventionAction.bind(null, id);

  const activeQuerySet = (querySets ?? []).find((qs) => qs.status === "active");
  const hasBaseline = (measurementCycles ?? []).some((c) => c.cycle_type === "baseline");

  const findings = (latestDiagnosis?.diagnosis_findings ?? []) as {
    id: string;
    title: string;
    severity: "bloccante" | "limitante" | "opportunita";
    description: string;
  }[];

  const suggestions =
    client.segment === "locale" || client.segment === "ecommerce" || client.segment === "b2b"
      ? suggestInterventions(client.segment, findings, (interventions ?? []).map((iv) => iv.title))
      : [];

  // Fase 4 -- confronto pre/post: la baseline è il ciclo completato più
  // vecchio con cycle_type "baseline", la verifica è il più recente con
  // cycle_type "verification". measurementCycles è ordinato started_at DESC,
  // quindi la baseline si trova continuando a sovrascrivere (l'ultima
  // assegnazione è la più vecchia), la verifica si fissa al primo incontro.
  const completedCycles = (measurementCycles ?? []).filter((c) => c.status === "completed");
  let baselineCycle: (typeof completedCycles)[number] | null = null;
  let verificationCycle: (typeof completedCycles)[number] | null = null;
  for (const c of completedCycles) {
    if (c.cycle_type === "baseline") baselineCycle = c;
    if (c.cycle_type === "verification" && !verificationCycle) verificationCycle = c;
  }

  const comparisonCycleIds = [baselineCycle?.id, verificationCycle?.id].filter((v): v is string => Boolean(v));
  const [{ data: compEngineStats }, { data: compSov }] =
    comparisonCycleIds.length > 0
      ? await Promise.all([
          supabase.from("measurement_cycle_engine_stats").select("measurement_cycle_id, citation_rate").in("measurement_cycle_id", comparisonCycleIds),
          supabase.from("measurement_cycle_share_of_voice").select("cycle_id, share_of_voice_ai").in("cycle_id", comparisonCycleIds),
        ])
      : [{ data: [] as { measurement_cycle_id: string; citation_rate: number | null }[] }, { data: [] as { cycle_id: string; share_of_voice_ai: number | null }[] }];

  const rateByCycle = new Map<string, number[]>();
  for (const s of compEngineStats ?? []) {
    if (s.citation_rate === null) continue;
    const arr = rateByCycle.get(s.measurement_cycle_id) ?? [];
    arr.push(s.citation_rate);
    rateByCycle.set(s.measurement_cycle_id, arr);
  }
  const avgRate = (cycleId: string | undefined) => {
    if (!cycleId) return null;
    const arr = rateByCycle.get(cycleId);
    return arr && arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  };
  const sovByCycle = new Map<string, number>();
  for (const s of compSov ?? []) if (s.share_of_voice_ai !== null) sovByCycle.set(s.cycle_id, s.share_of_voice_ai);

  const baselineRate = avgRate(baselineCycle?.id);
  const verificationRate = avgRate(verificationCycle?.id);
  const citationRateDeltaPct = baselineRate !== null && verificationRate !== null ? (verificationRate - baselineRate) * 100 : null;

  const baselineSov = baselineCycle ? (sovByCycle.get(baselineCycle.id) ?? null) : null;
  const verificationSov = verificationCycle ? (sovByCycle.get(verificationCycle.id) ?? null) : null;
  const shareOfVoiceDeltaPct = baselineSov !== null && verificationSov !== null ? (verificationSov - baselineSov) * 100 : null;

  const verificationQueryCount = verificationCycle
    ? ((querySets ?? []).find((qs) => qs.id === verificationCycle!.query_set_id)?.queries?.[0]?.count ?? 0)
    : 0;

  const suggestedRecommendation = recommendNextCycle(citationRateDeltaPct, verificationQueryCount);
  const createVerificationReport = createVerificationReportAction.bind(null, id);

  return (
    <AppShell activeKey="clienti" userEmail={user?.email ?? null}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>{client.name}</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            {client.website_url ? (
              <a href={client.website_url} target="_blank" rel="noreferrer">
                {client.website_url}
              </a>
            ) : (
              "Nessun sito web indicato"
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Badge tone="accent">{SEGMENT_LABEL[client.segment] ?? client.segment}</Badge>
          <Badge tone={client.status === "active" ? "positive" : client.status === "paused" ? "warning" : "neutral"}>
            {client.status}
          </Badge>
        </div>
      </div>

      {client.notes ? (
        <Card kicker="Note">
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>{client.notes}</p>
        </Card>
      ) : null}

      <Card
        title="Diagnosi"
        kicker={
          latestDiagnosis
            ? `Fase 1 · ultima esecuzione ${new Date(latestDiagnosis.run_at).toLocaleString("it-IT")}`
            : "Fase 1 — è recuperabile?"
        }
        actions={
          <form action={runDiagnosis}>
            <Button type="submit" variant="secondary" size="sm" iconLeft="stethoscope">
              Esegui diagnosi
            </Button>
          </form>
        }
      >
        {latestDiagnosis ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Metric label="Recoverability score" value={String(latestDiagnosis.recoverability_score)} unit="/100" />
            {findings.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {findings.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-1)",
                      paddingTop: "var(--space-3)",
                      borderTop: "var(--border-width) solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge tone={severityTone[f.severity]}>{f.severity}</Badge>
                      <span style={{ fontWeight: "var(--weight-medium)" }}>{f.title}</span>
                    </div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{f.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
                Nessun blocco tecnico rilevato nell&rsquo;ultima esecuzione.
              </p>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            {client.website_url
              ? "Nessuna diagnosi ancora eseguita per questo cliente."
              : "Aggiungi un sito web al cliente per poter eseguire la diagnosi."}
          </p>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", alignItems: "start" }}>
        <Card title="Competitor" kicker={`${competitors?.length ?? 0} totali`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {competitors && competitors.length > 0 ? (
              <CompetitorsTable competitors={competitors} deleteAction={deleteCompetitor} />
            ) : (
              <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
                Nessun competitor ancora — servono per calcolare lo share of voice AI.
              </p>
            )}

            <form
              action={addCompetitor}
              style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", paddingTop: "var(--space-2)", borderTop: "var(--border-width) solid var(--border-subtle)" }}
            >
              <Input name="name" placeholder="Nome competitor" required style={{ flex: 1 }} />
              <Input name="url" placeholder="https://..." type="url" style={{ flex: 1 }} />
              <Button type="submit" variant="secondary" iconLeft="plus">
                Aggiungi
              </Button>
            </form>
          </div>
        </Card>

        <Card
          title="Set di query"
          kicker={`${querySets?.length ?? 0} versioni`}
          actions={
            <form action={createQuerySet}>
              <Button type="submit" variant="secondary" size="sm" iconLeft="plus">
                Nuova versione
              </Button>
            </form>
          }
        >
          {querySets && querySets.length > 0 ? (
            <ClientQuerySetsTable clientId={id} querySets={querySets as QuerySet[]} />
          ) : (
            <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
              Nessun set di query ancora. Crea la prima versione per iniziare la Fase 2 — Misurazione.
            </p>
          )}
        </Card>
      </div>

      <Card
        title="Misurazione"
        kicker="Fase 2/4 — è citata? è migliorata?"
        actions={
          activeQuerySet ? (
            <form action={runMeasurement} style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <input type="hidden" name="query_set_id" value={activeQuerySet.id} />
              <Select
                name="cycle_type"
                size="sm"
                defaultValue={hasBaseline ? "verification" : "baseline"}
                options={[
                  { value: "baseline", label: "Baseline" },
                  { value: "verification", label: "Verifica" },
                ]}
              />
              <Button type="submit" variant="primary" size="sm" iconLeft="play">
                Avvia misurazione
              </Button>
            </form>
          ) : null
        }
      >
        {!activeQuerySet ? (
          <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            Attiva una versione del set di query prima di poter eseguire una misurazione.
          </p>
        ) : measurementCycles && measurementCycles.length > 0 ? (
          <MeasurementCyclesTable
            clientId={id}
            cycles={
              measurementCycles as {
                id: string;
                cycle_type: string;
                status: string;
                started_at: string;
                completed_at: string | null;
                query_sets: { version: number } | { version: number }[] | null;
              }[]
            }
          />
        ) : (
          <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            Nessuna misurazione ancora eseguita. La prima esecuzione diventa la baseline di Fase 2.
          </p>
        )}
      </Card>

      <Card title="Interventi" kicker="Fase 3 — quali leve agire?">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {suggestions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <span style={{ fontSize: "var(--text-2xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                Azioni suggerite -- diagnosi + libreria di leve per il segmento
              </span>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "var(--space-4)",
                    paddingTop: "var(--space-3)",
                    borderTop: "var(--border-width) solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge tone={s.priority === 1 ? "negative" : s.priority === 2 ? "warning" : "neutral"}>
                        priorità {s.priority}
                      </Badge>
                      <span style={{ fontWeight: "var(--weight-medium)" }}>{s.title}</span>
                    </div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{s.description}</span>
                  </div>
                  <form action={createIntervention} style={{ flex: "none" }}>
                    <input type="hidden" name="title" value={s.title} />
                    <input type="hidden" name="lever_category" value={s.leverCategory} />
                    <input type="hidden" name="priority" value={s.priority} />
                    {s.diagnosisFindingId ? <input type="hidden" name="diagnosis_finding_id" value={s.diagnosisFindingId} /> : null}
                    <Button type="submit" variant="secondary" size="sm" iconLeft="plus">
                      Aggiungi
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          ) : null}

          {interventions && interventions.length > 0 ? (
            <InterventionsTable
              interventions={interventions as InterventionRow[]}
              advanceAction={advanceIntervention}
              deleteAction={deleteIntervention}
            />
          ) : (
            <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
              Nessun intervento ancora avviato. Aggiungi una delle azioni suggerite sopra per iniziare.
            </p>
          )}
        </div>
      </Card>

      <Card title="Verifica" kicker="Fase 4 — è migliorata? Con che limiti?">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {!baselineCycle || !verificationCycle ? (
            <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
              {!baselineCycle
                ? "Serve un ciclo di misurazione \"Baseline\" completato per poter fare un confronto."
                : "Serve almeno un ciclo di misurazione \"Verifica\" completato, oltre alla baseline, per poter fare un confronto."}
            </p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-4)" }}>
                <Metric
                  label="Citation rate (ultima verifica)"
                  value={verificationRate === null ? "—" : verificationRate.toFixed(2)}
                  delta={citationRateDeltaPct === null ? undefined : citationRateDeltaPct}
                  deltaUnit="pt"
                  note="vs baseline"
                />
                <Metric
                  label="Share of voice AI (ultima verifica)"
                  value={verificationSov === null ? "—" : verificationSov.toFixed(2)}
                  delta={shareOfVoiceDeltaPct === null ? undefined : shareOfVoiceDeltaPct}
                  deltaUnit="pt"
                  note="vs baseline"
                />
              </div>

              <form action={createVerificationReport} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <input type="hidden" name="baseline_cycle_id" value={baselineCycle.id} />
                <input type="hidden" name="verification_cycle_id" value={verificationCycle.id} />

                <label style={{ display: "block" }}>
                  <span style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
                    Sintesi
                  </span>
                  <textarea
                    name="summary"
                    rows={3}
                    placeholder="Cosa è cambiato tra baseline e verifica, in poche righe."
                    style={{
                      width: "100%",
                      resize: "vertical",
                      padding: "var(--space-3)",
                      background: "var(--surface-1)",
                      color: "var(--text-primary)",
                      border: "var(--border-width) solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-base)",
                      letterSpacing: "var(--tracking-tight)",
                    }}
                  />
                </label>

                <label style={{ display: "block" }}>
                  <span style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
                    Raccomandazione sul ciclo successivo
                  </span>
                  <textarea
                    name="recommendation"
                    rows={2}
                    defaultValue={suggestedRecommendation}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      padding: "var(--space-3)",
                      background: "var(--surface-1)",
                      color: "var(--text-primary)",
                      border: "var(--border-width) solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-base)",
                      letterSpacing: "var(--tracking-tight)",
                    }}
                  />
                </label>

                <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>
                  Il report includerà sempre la sezione limiti del dato (non-determinismo, nessuna prova di causalità
                  diretta sulle vendite) -- non è rimovibile.
                </p>

                <Button type="submit" variant="primary" iconLeft="check-check" style={{ alignSelf: "flex-start" }}>
                  Salva report di verifica
                </Button>
              </form>
            </>
          )}

          {verificationReports && verificationReports.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <span style={{ fontSize: "var(--text-2xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                Report salvati
              </span>
              {verificationReports.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-1)",
                    paddingTop: "var(--space-3)",
                    borderTop: "var(--border-width) solid var(--border-subtle)",
                  }}
                >
                  <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>
                    {new Date(r.created_at).toLocaleString("it-IT")}
                  </span>
                  {r.summary ? <span style={{ color: "var(--text-primary)" }}>{r.summary}</span> : null}
                  {r.recommendation ? (
                    <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                      Raccomandazione: {r.recommendation}
                    </span>
                  ) : null}
                  <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>{r.limits_note}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Card>
    </AppShell>
  );
}
