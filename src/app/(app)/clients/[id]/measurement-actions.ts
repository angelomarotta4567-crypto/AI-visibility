"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { startMeasurementCycle, runMeasurementCycleChunk, type ChunkResult } from "@/lib/engines/run-cycle";

export async function runMeasurementCycleAction(clientId: string, formData: FormData) {
  const querySetId = String(formData.get("query_set_id") ?? "");
  const cycleTypeRaw = String(formData.get("cycle_type") ?? "baseline");
  const cycleType = cycleTypeRaw === "verification" ? "verification" : "baseline";

  if (!querySetId) throw new Error("Nessun set di query attivo per questo cliente.");

  const supabase = await createClient();
  const { cycleId } = await startMeasurementCycle({ supabase, clientId, querySetId, cycleType });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}/measurement-cycles/${cycleId}`);
}

/** Chiamata ripetutamente dal client (vedi cycle-progress-runner.tsx) finché
 * il ciclo non è completo -- ogni chiamata esegue solo un piccolo blocco di
 * job, così nessuna singola invocazione rischia il timeout della piattaforma. */
export async function processMeasurementCycleChunkAction(clientId: string, cycleId: string): Promise<ChunkResult> {
  const supabase = await createClient();
  const result = await runMeasurementCycleChunk({ supabase, cycleId });
  if (result.done) revalidatePath(`/clients/${clientId}`);
  return result;
}
