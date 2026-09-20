"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createVerificationReportAction(clientId: string, formData: FormData) {
  const baselineCycleId = String(formData.get("baseline_cycle_id") ?? "").trim();
  const verificationCycleId = String(formData.get("verification_cycle_id") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const recommendation = String(formData.get("recommendation") ?? "").trim();

  if (!baselineCycleId || !verificationCycleId) {
    throw new Error("Servono sia un ciclo baseline che un ciclo di verifica completati.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // limits_note non viene passato: la colonna ha un default NOT NULL con il
  // testo obbligatorio sui limiti del dato (CLAUDE.md 6.4) -- non è un campo
  // che l'utente può svuotare da qui.
  const { error } = await supabase.from("verification_reports").insert({
    client_id: clientId,
    baseline_cycle_id: baselineCycleId,
    verification_cycle_id: verificationCycleId,
    summary: summary || null,
    recommendation: recommendation || null,
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}
