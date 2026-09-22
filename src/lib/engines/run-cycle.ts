import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEngineAdapter } from "./registry";
import { classifyMentions, type Subject } from "./classify";

const RUNS_PER_QUERY = 3; // vincolo CLAUDE.md #1: mai trattare una singola esecuzione come dato stabile.

// Osservato in produzione: un cycle è rimasto "running" per oltre un giorno
// (nessuna raw_response salvata, nessun completed_at) -- sintomo di una
// singola chiamata adapter che si blocca indefinitamente (nessun timeout su
// fetch), che blocca l'intero ciclo finché Vercel non uccide la function,
// senza mai raggiungere l'update finale dello status.
const ADAPTER_CALL_TIMEOUT_MS = 45_000;

// Un ciclo grande (15 query x 3 motori x 3 run = 135 chiamate) supera
// qualunque timeout di una singola invocazione serverless se eseguito tutto
// insieme. Invece di un unico Server Action sincrono, il ciclo viene diviso
// in blocchi piccoli: ogni chiamata a runMeasurementCycleChunk esegue al più
// CHUNK_SIZE job e ritorna il progresso. Il chiamante (un componente client
// che fa polling) richiama finché il ciclo non è completo. Il progresso è
// ricostruito dallo stato del DB (righe già inserite + contatore fallimenti),
// quindi riaprire un ciclo "running" dopo aver chiuso il browser lo riprende
// automaticamente da dove si era fermato, invece di lasciarlo bloccato per
// sempre.
const CHUNK_SIZE = 1;

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

type Job = { queryId: string; queryText: string; engineCode: string };

async function executeJob(supabase: SupabaseClient, cycleId: string, subjects: Subject[], job: Job): Promise<void> {
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

export type StartCycleParams = {
  supabase: SupabaseClient;
  clientId: string;
  querySetId: string;
  cycleType: "baseline" | "verification";
};

/** Crea il ciclo e ritorna subito il suo id -- l'esecuzione vera e propria
 * avviene a blocchi via runMeasurementCycleChunk, chiamata ripetutamente dal
 * client mentre l'utente guarda la pagina del ciclo. */
export async function startMeasurementCycle({
  supabase,
  clientId,
  querySetId,
  cycleType,
}: StartCycleParams): Promise<{ cycleId: string }> {
  const { data: queries, error: queriesError } = await supabase
    .from("queries")
    .select("id")
    .eq("query_set_id", querySetId)
    .limit(1);
  if (queriesError) throw new Error(queriesError.message);
  if (!queries || queries.length === 0) throw new Error("Il set di query selezionato non contiene query.");

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
  if (!cycle) throw new Error("Impossibile creare il ciclo di misurazione, riprova.");

  return { cycleId: cycle.id };
}

export type ChunkResult = {
  done: boolean;
  totalJobs: number;
  processedJobs: number;
  successfulRuns: number;
  failedRuns: number;
  skippedEngines: string[];
};

/** Esegue al più CHUNK_SIZE job del ciclo e ritorna il progresso aggiornato.
 * Idempotente rispetto alla ripresa: la lista job è ricostruita in modo
 * deterministico (stesso ordine ad ogni chiamata) e il punto di ripresa è
 * "quante righe/fallimenti sono già registrati", non uno stato in memoria. */
export async function runMeasurementCycleChunk({
  supabase,
  cycleId,
}: {
  supabase: SupabaseClient;
  cycleId: string;
}): Promise<ChunkResult> {
  const { data: cycle, error: cycleError } = await supabase
    .from("measurement_cycles")
    .select("id, client_id, query_set_id, status, total_jobs, failed_jobs")
    .eq("id", cycleId)
    .single();
  if (cycleError) throw new Error(cycleError.message);
  if (!cycle) throw new Error("Ciclo di misurazione non trovato.");

  if (cycle.status === "completed" || cycle.status === "failed") {
    const total = cycle.total_jobs ?? 0;
    return {
      done: true,
      totalJobs: total,
      processedJobs: total,
      successfulRuns: total - cycle.failed_jobs,
      failedRuns: cycle.failed_jobs,
      skippedEngines: [],
    };
  }

  const [{ data: client }, { data: competitors }, { data: queries }, { data: engines }, { count: successfulCount }] =
    await Promise.all([
      supabase.from("clients").select("name, website_url, aliases").eq("id", cycle.client_id).single(),
      supabase.from("competitors").select("id, name, url, aliases").eq("client_id", cycle.client_id).order("id"),
      supabase.from("queries").select("id, text").eq("query_set_id", cycle.query_set_id).order("id"),
      supabase.from("engines").select("code").eq("active", true).order("code"),
      supabase
        .from("measurement_runs")
        .select("id", { count: "exact", head: true })
        .eq("measurement_cycle_id", cycleId),
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
    throw new Error("Nessun motore AI è configurato con una chiave API attiva su questo account.");
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

  const jobs: Job[] = queries.flatMap((q) =>
    availableEngines.flatMap((engineCode) =>
      Array.from({ length: RUNS_PER_QUERY }, () => ({
        queryId: q.id as string,
        queryText: q.text as string,
        engineCode,
      })),
    ),
  );

  const totalJobs = jobs.length;
  const successfulSoFar = successfulCount ?? 0;
  const processedSoFar = successfulSoFar + cycle.failed_jobs;

  if (cycle.total_jobs == null) {
    await supabase.from("measurement_cycles").update({ total_jobs: totalJobs }).eq("id", cycleId);
  }

  const chunkJobs = jobs.slice(processedSoFar, processedSoFar + CHUNK_SIZE);

  let chunkFailures = 0;
  for (const job of chunkJobs) {
    let ok = false;
    // Un retry: i fallimenti osservati contro Gemini sono quasi tutti
    // transitori (timeout / 503 alta domanda), non errori deterministici.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await executeJob(supabase, cycleId, subjects, job);
        ok = true;
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[measurement] ${job.engineCode} query=${job.queryId} attempt ${attempt} failed: ${message}`);
      }
    }
    if (!ok) chunkFailures++;
  }

  const newFailedTotal = cycle.failed_jobs + chunkFailures;
  if (chunkFailures > 0) {
    await supabase.from("measurement_cycles").update({ failed_jobs: newFailedTotal }).eq("id", cycleId);
  }

  const newProcessedSoFar = processedSoFar + chunkJobs.length;
  const done = newProcessedSoFar >= totalJobs;
  const newSuccessfulTotal = successfulSoFar + (chunkJobs.length - chunkFailures);

  if (done) {
    await supabase
      .from("measurement_cycles")
      .update({
        status: newSuccessfulTotal > 0 ? "completed" : "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", cycleId);
  }

  return {
    done,
    totalJobs,
    processedJobs: newProcessedSoFar,
    successfulRuns: newSuccessfulTotal,
    failedRuns: newFailedTotal,
    skippedEngines,
  };
}
