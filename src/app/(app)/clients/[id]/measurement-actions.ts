"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runMeasurementCycle } from "@/lib/engines/run-cycle";

export async function runMeasurementCycleAction(clientId: string, formData: FormData) {
  const querySetId = String(formData.get("query_set_id") ?? "");
  const cycleTypeRaw = String(formData.get("cycle_type") ?? "baseline");
  const cycleType = cycleTypeRaw === "verification" ? "verification" : "baseline";

  if (!querySetId) throw new Error("Nessun set di query attivo per questo cliente.");

  const supabase = await createClient();
  const summary = await runMeasurementCycle({ supabase, clientId, querySetId, cycleType });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}/measurement-cycles/${summary.cycleId}`);
}
