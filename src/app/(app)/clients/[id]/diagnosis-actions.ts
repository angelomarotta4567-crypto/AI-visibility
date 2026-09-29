"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runDiagnosis, diagnoseNoWebsite } from "@/lib/diagnosis/run";

export async function runDiagnosisAction(clientId: string) {
  const supabase = await createClient();

  const [{ data: client }, { data: userData }] = await Promise.all([
    supabase.from("clients").select("website_url").eq("id", clientId).single(),
    supabase.auth.getUser(),
  ]);

  const result = client?.website_url ? await runDiagnosis(client.website_url) : diagnoseNoWebsite();

  const { data: run, error: runError } = await supabase
    .from("diagnosis_runs")
    .insert({
      client_id: clientId,
      recoverability_score: result.recoverability_score,
      created_by: userData.user?.id,
    })
    .select("id")
    .single();
  if (runError) throw new Error(runError.message);

  if (result.findings.length > 0) {
    const { error: findingsError } = await supabase.from("diagnosis_findings").insert(
      result.findings.map((f) => ({
        diagnosis_run_id: run.id,
        title: f.title,
        severity: f.severity,
        description: f.description,
      })),
    );
    if (findingsError) throw new Error(findingsError.message);
  }

  revalidatePath(`/clients/${clientId}`);
}
