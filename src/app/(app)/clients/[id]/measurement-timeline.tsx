"use client";

import { useRouter } from "next/navigation";
import { Badge, DataTable, LineChart } from "@/components/ds";
import { MEASUREMENT_CYCLE_STATUS_LABEL, ENGINE_LABEL } from "@/lib/status-labels";
import { chartRows, type TimelineRow } from "@/lib/measurements/timeline";

const statusTone: Record<string, "positive" | "accent" | "negative" | "neutral"> = {
  completed: "positive",
  running: "accent",
  failed: "negative",
  pending: "neutral",
};

const ENGINE_ORDER = ["chatgpt", "gemini", "perplexity", "copilot"];
const SERIES_COLORS = ["var(--chart-series-1)", "var(--chart-series-2)", "var(--chart-series-3)"];

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v * 1000) / 10}%`);

function Delta({ pp, partial }: { pp: number | null; partial?: boolean }) {
  if (pp === null) return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
  const rounded = Math.round(pp * 10) / 10;
  const tone = rounded > 0 ? "positive" : rounded < 0 ? "negative" : "neutral";
  return (
    <span title={partial ? "Calcolata solo sui motori presenti in entrambe le misurazioni" : undefined} style={{ whiteSpace: "nowrap" }}>
      <Badge tone={tone}>{`${rounded > 0 ? "+" : ""}${String(rounded).replace(".", ",")} pt`}</Badge>
      {partial ? <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-2xs)" }}> *</span> : null}
    </span>
  );
}

export function MeasurementTimeline({ clientId, rows }: { clientId: string; rows: TimelineRow[] }) {
  const router = useRouter();

  const engineCodes = ENGINE_ORDER.filter((e) => rows.some((r) => e in r.engines));
  const chart = chartRows(rows);
  const chartEngines = engineCodes.filter((e) => chart.every((r) => r.engines[e] !== null && r.engines[e] !== undefined));
  const lastChart = chart[chart.length - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {chart.length >= 2 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-2xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
            Andamento nel tempo · quanto spesso lo studio viene citato
          </span>
          <LineChart
            height={200}
            labels={chart.map((r) => `M${r.number}`)}
            valueFormat={(v: number) => `${Math.round(v)}%`}
            series={[
              { data: chart.map((r) => (r.avg as number) * 100), color: "var(--text-primary)" },
              ...chartEngines.map((e, i) => ({ data: chart.map((r) => (r.engines[e] as number) * 100), color: SERIES_COLORS[i % SERIES_COLORS.length], dashed: true })),
            ]}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
            <span>
              <span style={{ color: "var(--text-primary)" }}>●</span> Media dei motori (linea piena)
            </span>
            {chartEngines.map((e, i) => (
              <span key={e}>
                <span style={{ color: SERIES_COLORS[i % SERIES_COLORS.length] }}>●</span> {ENGINE_LABEL[e] ?? e}
              </span>
            ))}
          </div>
          {lastChart?.version !== null && lastChart?.version !== undefined ? (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
              Nel grafico solo le misurazioni con lo stesso set di domande (v{lastChart.version}) e gli stessi motori dell&rsquo;ultima: è l&rsquo;unico confronto che vale.
            </span>
          ) : null}
        </div>
      ) : (
        <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
          Il grafico dell&rsquo;andamento compare dalla seconda misurazione completata con lo stesso set di domande.
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <DataTable
          columns={[
            {
              key: "number",
              header: "Misurazione",
              render: (r: TimelineRow) => (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", whiteSpace: "nowrap" }}>
                  {r.number === null ? <span style={{ color: "var(--text-tertiary)" }}>Tentativo non riuscito</span> : <strong>Misurazione {r.number}</strong>}
                  {r.isStart ? <Badge tone="accent">Partenza</Badge> : null}
                </span>
              ),
            },
            {
              key: "started_at",
              header: "Data",
              render: (r: TimelineRow) => new Date(r.startedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }),
            },
            {
              key: "set",
              header: "Domande",
              render: (r: TimelineRow) => `v${r.version ?? "—"}${r.queryCount ? ` · ${r.queryCount}` : ""}`,
            },
            {
              key: "status",
              header: "Stato",
              render: (r: TimelineRow) => <Badge tone={statusTone[r.status] ?? "neutral"}>{MEASUREMENT_CYCLE_STATUS_LABEL[r.status] ?? r.status}</Badge>,
            },
            ...engineCodes.map((e) => ({
              key: `e-${e}`,
              header: ENGINE_LABEL[e] ?? e,
              render: (r: TimelineRow) => pct(r.engines[e]),
            })),
            { key: "runs", header: "Risposte", render: (r: TimelineRow) => (r.runs > 0 ? r.runs : "—") },
            { key: "avg", header: "Media", render: (r: TimelineRow) => <strong>{pct(r.avg)}</strong> },
            { key: "sov", header: "Quota di voce", render: (r: TimelineRow) => pct(r.sov) },
            { key: "dprev", header: "Rispetto alla precedente", render: (r: TimelineRow) => <Delta pp={r.deltaPrev} partial={r.deltaPrevPartial} /> },
            {
              key: "dstart",
              header: "Dalla partenza",
              render: (r: TimelineRow) => (r.otherSet ? <Badge tone="warning">Set diverso</Badge> : <Delta pp={r.deltaStart} partial={r.deltaStartPartial} />),
            },
          ]}
          rows={rows}
          onRowClick={(r: TimelineRow) => router.push(`/clients/${clientId}/measurement-cycles/${r.id}`)}
        />
      </div>

      <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: "var(--text-xs)", maxWidth: "85ch", lineHeight: "var(--leading-normal)" }}>
        Come leggerla: «pt» sono punti percentuali (da 10% a 14% = +4 pt). Le risposte delle AI cambiano da un giorno all&rsquo;altro anche senza che lo studio faccia nulla,
        quindi variazioni di pochi punti possono essere rumore; contano le tendenze su più misurazioni. Il confronto vale solo con lo stesso set di domande e lo stesso numero di ripetizioni.
        Un asterisco (*) vuol dire che la variazione è calcolata solo sui motori presenti in entrambe le misurazioni (le prime misurazioni possono non avere ChatGPT). Clicca una riga per vedere il dettaglio.
      </p>
    </div>
  );
}
