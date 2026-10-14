// Mette in fila le misurazioni di un cliente nel tempo: "Misurazione 1, 2, 3…"
// con i risultati di ognuna e la variazione rispetto alla precedente e alla prima.
// Funzioni pure (nessun accesso al database): i dati arrivano già letti.

export type CycleInput = {
  id: string;
  cycle_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  query_set_id: string;
  query_sets: { version: number } | { version: number }[] | null;
};

export type EngineStat = { measurement_cycle_id: string; engine_code: string; client_runs: number; citation_rate: number | null };
export type SovStat = { cycle_id: string; share_of_voice_ai: number | null };

export type TimelineRow = {
  id: string;
  /** Numero d'ordine tra le misurazioni valide (1, 2, 3…). I tentativi falliti non ne hanno. */
  number: number | null;
  status: string;
  startedAt: string;
  querySetId: string;
  version: number | null;
  queryCount: number | null;
  runs: number;
  /** citation_rate per motore (0-1); null se quel motore non ha esecuzioni valide. */
  engines: Record<string, number | null>;
  /** Media dei motori con dati (0-1). */
  avg: number | null;
  sov: number | null;
  /** È la prima misurazione completata: il punto di partenza dei confronti. */
  isStart: boolean;
  /** Variazione in punti percentuali rispetto alla misurazione completata precedente con lo stesso set di domande. */
  deltaPrev: number | null;
  /** true se la variazione è calcolata solo sui motori presenti in entrambe le misurazioni. */
  deltaPrevPartial: boolean;
  /** Variazione in punti percentuali rispetto al punto di partenza. */
  deltaStart: number | null;
  deltaStartPartial: boolean;
  /** Il set di domande è diverso da quello del punto di partenza: i numeri non sono confrontabili. */
  otherSet: boolean;
};

const versionOf = (qs: CycleInput["query_sets"]): number | null => (!qs ? null : Array.isArray(qs) ? (qs[0]?.version ?? null) : qs.version);

export function buildTimeline(
  cycles: CycleInput[],
  stats: EngineStat[],
  sovs: SovStat[],
  queryCountBySet: Record<string, number>,
): TimelineRow[] {
  const ordered = [...cycles].sort((a, b) => a.started_at.localeCompare(b.started_at));

  const byCycle = new Map<string, EngineStat[]>();
  for (const s of stats) byCycle.set(s.measurement_cycle_id, [...(byCycle.get(s.measurement_cycle_id) ?? []), s]);
  const sovBy = new Map(sovs.map((s) => [s.cycle_id, s.share_of_voice_ai]));

  let counter = 0;
  const rows: TimelineRow[] = ordered.map((c) => {
    const st = c.status === "completed" ? (byCycle.get(c.id) ?? []) : [];
    const engines: Record<string, number | null> = {};
    for (const s of st) engines[s.engine_code] = s.citation_rate;
    const rates = Object.values(engines).filter((v): v is number => v !== null);
    return {
      id: c.id,
      number: c.status === "failed" ? null : ++counter,
      status: c.status,
      startedAt: c.started_at,
      querySetId: c.query_set_id,
      version: versionOf(c.query_sets),
      queryCount: queryCountBySet[c.query_set_id] ?? null,
      runs: st.reduce((a, s) => a + s.client_runs, 0),
      engines,
      avg: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null,
      sov: c.status === "completed" ? (sovBy.get(c.id) ?? null) : null,
      isStart: false,
      deltaPrev: null,
      deltaPrevPartial: false,
      deltaStart: null,
      deltaStartPartial: false,
      otherSet: false,
    };
  });

  const start = rows.find((r) => r.status === "completed" && r.avg !== null);
  let prev: TimelineRow | null = null;
  for (const r of rows) {
    if (r.status !== "completed" || r.avg === null) continue;
    if (r === start) {
      r.isStart = true;
    } else if (start) {
      r.otherSet = r.querySetId !== start.querySetId;
      if (!r.otherSet) {
        const d = deltaOnCommonEngines(r, start);
        r.deltaStart = d.pp;
        r.deltaStartPartial = d.partial;
      }
    }
    if (prev && prev.querySetId === r.querySetId) {
      const d = deltaOnCommonEngines(r, prev);
      r.deltaPrev = d.pp;
      r.deltaPrevPartial = d.partial;
    }
    prev = r;
  }
  return rows;
}

const validCodes = (r: TimelineRow) => Object.keys(r.engines).filter((e) => r.engines[e] !== null);

/** Le prime misurazioni di un cliente possono avere meno motori (es. senza ChatGPT): confrontare medie su motori diversi
 * non ha senso, quindi la variazione si calcola sui soli motori presenti in entrambe. */
function deltaOnCommonEngines(a: TimelineRow, b: TimelineRow): { pp: number | null; partial: boolean } {
  const ca = validCodes(a);
  const cb = validCodes(b);
  const common = ca.filter((e) => cb.includes(e));
  if (common.length === 0) return { pp: null, partial: false };
  const mean = (r: TimelineRow) => common.reduce((acc, e) => acc + (r.engines[e] as number), 0) / common.length;
  return { pp: (mean(a) - mean(b)) * 100, partial: common.length < ca.length || common.length < cb.length };
}

/** Misurazioni da disegnare nel grafico: completate, con lo stesso set di domande e gli stessi motori dell'ultima,
 * altrimenti la linea mescolerebbe cose diverse. */
export function chartRows(rows: TimelineRow[]): TimelineRow[] {
  const done = rows.filter((r) => r.status === "completed" && r.avg !== null);
  const last = done[done.length - 1];
  if (!last) return [];
  const key = (r: TimelineRow) => validCodes(r).sort().join(",");
  return done.filter((r) => r.querySetId === last.querySetId && key(r) === key(last));
}
