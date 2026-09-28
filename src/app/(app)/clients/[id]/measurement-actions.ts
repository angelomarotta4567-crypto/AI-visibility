"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { startMeasurementCycle } from "@/lib/engines/run-cycle";
import { triggerMeasurementTick } from "@/lib/engines/tick";

export async function runMeasurementCycleAction(clientId: string, formData: FormData) {
  const querySetId = String(formData.get("query_set_id") ?? "");
  const cycleTypeRaw = String(formData.get("cycle_type") ?? "baseline");
  const cycleType = cycleTypeRaw === "verification" ? "verification" : "baseline";

  if (!querySetId) throw new Error("Nessun set di query attivo per questo cliente.");

  const supabase = await createClient();
  const { cycleId } = await startMeasurementCycle({ supabase, clientId, querySetId, cycleType });

  // L'esecuzione prosegue lato server (vedi /api/measurement/tick) anche se
  // questa pagina non viene mai aperta o viene chiusa a metà.
  after(() => triggerMeasurementTick(cycleId));

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}/measurement-cycles/${cycleId}`);
}

export type CycleProgress = {
  status: string;
  totalJobs: number | null;
  processedJobs: number;
  successfulRuns: number;
  failedRuns: number;
};

/** Sola lettura: usata dalla pagina del ciclo per aggiornare la barra di
 * avanzamento mentre l'esecuzione vera prosegue sul server via tick -- non fa
 * più avanzare nulla lei stessa (vedi cycle-progress-runner.tsx). */
export async function getMeasurementCycleProgressAction(cycleId: string): Promise<CycleProgress> {
  const supabase = await createClient();
  const { data: cycle, error } = await supabase
    .from("measurement_cycles")
    .select("status, total_jobs, failed_jobs")
    .eq("id", cycleId)
    .single();
  if (error) throw new Error(error.message);

  const { count: successfulCount } = await supabase
    .from("measurement_runs")
    .select("id", { count: "exact", head: true })
    .eq("measurement_cycle_id", cycleId);

  const successfulRuns = successfulCount ?? 0;
  return {
    status: cycle.status,
    totalJobs: cycle.total_jobs,
    processedJobs: successfulRuns + cycle.failed_jobs,
    successfulRuns,
    failedRuns: cycle.failed_jobs,
  };
}

/** Rete di sicurezza: la catena server-to-server (dopo un tick, il tick
 * successivo si autoinnesca via after() -- vedi /api/measurement/tick) di
 * norma prosegue da sola, ma un anello può perdersi in silenzio senza che
 * nulla lo segnali. Se la pagina del ciclo nota che l'avanzamento è fermo,
 * chiama questa per dare una spinta -- idempotente, il prossimo job da fare
 * si ricalcola sempre dallo stato nel DB, non da un contatore in memoria. */
export async function nudgeMeasurementCycleAction(cycleId: string): Promise<void> {
  await triggerMeasurementTick(cycleId);
}
