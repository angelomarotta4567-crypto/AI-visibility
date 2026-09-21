import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEngineAdapter } from "./registry";
import { classifyMentions, type Subject } from "./classify";
import { mapWithConcurrency } from "./concurrency";

const RUNS_PER_QUERY = 3; // vincolo CLAUDE.md #1: mai trattare una singola esecuzione come dato stabile.
// Measured directly against this Gemini key/tier: solo calls reliably finish
// in ~10s, but 2+ concurrent grounded calls consistently stall past the 30s
// timeout (looks like a per-second/concurrent-request cap on this tier).
// Sequential is slower end-to-end but actually completes instead of losing
// most of the runs.
const CONCURRENCY = 1;

// Osservato in produzione: un cycle è rimasto "running" per oltre un giorno
// (nessuna raw_response salvata, nessun completed_at) -- sintomo di una
// singola chiamata adapter che si blocca indefinitamente (nessun timeout su
// fetch), che con CONCURRENCY=1 impalla l'intero ciclo finché Vercel non
// uccide la function, senza mai raggiungere l'update finale dello status.
// Non risolve il vincolo più ampio dei tempi totali su un set grande di query
// (serve esecuzione a blocchi/riprendibile, task di martedì) ma impedisce che
// un singolo motore lento blocchi tutto a tempo indefinito.
const ADAPTER_CALL_TIMEOUT_MS = 45_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout dopo ${ms / 1000}s: ${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function hostnameOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export type RunCycleParams = {
  supabase: SupabaseClient;
  clientId: string;
  querySetId: string;
  cycleType: "baseline" | "verification";
};

export type RunCycleSummary = {
  cycleId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  skippedEngines: string[];
};

export async function runMeasurementCycle({
  supabase,
  clientId,
  querySetId,
  cycleType,
}: RunCycleParams): Promise<RunCycleSummary> {
  const [{ data: client }, { data: competitors }, { data: queries }, { data: engines }] = await Promise.all([
    supabase.from("clients").select("name, website_url, aliases").eq("id", clientId).single(),
    supabase.from("competitors").select("id, name, url, aliases").eq("client_id", clientId),
    supabase.from("queries").select("id, text").eq("query_set_id", querySetId),
    supabase.from("engines").select("code").eq("active", true),
  ]);

  if (!client) throw new Error("Cliente non trovato.");
  if (!queries || queries.length === 0) throw new Error("Il set di query selezionato non contiene query.");

  const availableEngines: string[] = [];
  const skippedEngines: string[] = [];
  for (const e of engines ?? []) {
    const adapter = getEngineAdapter(e.code);
    if (adapter && adapter.isConfigured()) availableEngines.push(e.code);
    else skippedEngines.push(e.code);
  }
  if (availableEngines.length === 0) {
    throw new Error("Nessun motore configurato con un adapter attivo (vedi src/lib/engines/registry.ts).");
  }

  const subjects: Subject[] = [
    {
      subjectType: "client",
      competitorId: null,
      nameTerms: [client.name, ...((client.aliases as string[] | null) ?? [])],
      hostnames: [hostnameOf(client.website_url)].filter((h): h is string => Boolean(h)),
    },
    ...(competitors ?? []).map((c) => ({
      subjectType: "competitor" as const,
      competitorId: c.id as string,
      nameTerms: [c.name as string, ...((c.aliases as string[] | null) ?? [])],
      hostnames: [hostnameOf(c.url as string | null)].filter((h): h is string => Boolean(h)),
    })),
  ];

  const { data: cycle, error: cycleError } = await supabase
    .from("measurement_cycles")
    .insert({
      client_id: clientId,
      query_set_id: querySetId,
      cycle_type: cycleType,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (cycleError) throw new Error(cycleError.message);
  if (!cycle) throw new Error("measurement_cycles insert returned no row.");
  const cycleId: string = cycle.id;

  const jobs = queries.flatMap((q) =>
    availableEngines.flatMap((engineCode) =>
      Array.from({ length: RUNS_PER_QUERY }, () => ({
        queryId: q.id as string,
        queryText: q.text as string,
        engineCode,
      })),
    ),
  );

  async function executeJob(job: (typeof jobs)[number]) {
    const adapter = getEngineAdapter(job.engineCode)!;
    const result = await withTimeout(
      adapter.query(job.queryText),
      ADAPTER_CALL_TIMEOUT_MS,
      `${job.engineCode} query="${job.queryText}"`,
    );
    const mentions = classifyMentions(result, subjects);

    const { data: run, error: runError } = await supabase
      .from("measurement_runs")
      .insert({
        measurement_cycle_id: cycleId,
        query_id: job.queryId,
        engine_code: job.engineCode,
        raw_response: {
          text: result.responseText,
          citations: result.citations,
          ...(typeof result.raw === "object" ? result.raw : {}),
        },
      })
      .select("id")
      .single();
    if (runError) throw new Error(runError.message);

    const { error: mentionsError } = await supabase.from("measurement_run_mentions").insert(
      mentions.map((m) => ({
        measurement_run_id: run.id,
        subject_type: m.subjectType,
        competitor_id: m.competitorId,
        prominence: m.prominence,
        rank: m.rank,
      })),
    );
    if (mentionsError) throw new Error(mentionsError.message);
  }

  const outcomes = await mapWithConcurrency(jobs, CONCURRENCY, async (job) => {
    // One retry: observed failures against Gemini are near-exclusively
    // transient (timeout / 503 high-demand), not deterministic errors, so a
    // single retry recovers most of them instead of losing the run entirely.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await executeJob(job);
        return { ok: true as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[measurement] ${job.engineCode} query=${job.queryId} attempt ${attempt} failed: ${message}`);
        if (attempt === 2) return { ok: false as const, error: message };
      }
    }
    return { ok: false as const, error: "unreachable" };
  });

  const successfulRuns = outcomes.filter((o) => o.ok).length;
  const failedRuns = outcomes.length - successfulRuns;

  await supabase
    .from("measurement_cycles")
    .update({
      status: successfulRuns > 0 ? "completed" : "failed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", cycleId);

  return { cycleId, totalRuns: outcomes.length, successfulRuns, failedRuns, skippedEngines };
}
