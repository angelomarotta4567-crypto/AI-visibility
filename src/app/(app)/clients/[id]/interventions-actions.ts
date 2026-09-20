"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Status = "assigned" | "in_progress" | "completed" | "verified";

export async function createInterventionAction(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const leverCategory = String(formData.get("lever_category") ?? "").trim();
  const priorityRaw = formData.get("priority");
  const diagnosisFindingId = String(formData.get("diagnosis_finding_id") ?? "").trim();

  if (!title) throw new Error("Il titolo dell'intervento è obbligatorio.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("interventions").insert({
    client_id: clientId,
    title,
    lever_category: leverCategory || null,
    priority: priorityRaw ? Number(priorityRaw) : null,
    diagnosis_finding_id: diagnosisFindingId || null,
    status: "assigned",
    assigned_to: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

const NEXT_STATUS: Record<Status, Status | null> = {
  assigned: "in_progress",
  in_progress: "completed",
  completed: "verified",
  verified: null,
};

export async function advanceInterventionStatusAction(clientId: string, interventionId: string, currentStatus: string) {
  const next = NEXT_STATUS[currentStatus as Status];
  if (!next) return;

  const supabase = await createClient();
  const { error } = await supabase.from("interventions").update({ status: next }).eq("id", interventionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteInterventionAction(clientId: string, interventionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("interventions").delete().eq("id", interventionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}
