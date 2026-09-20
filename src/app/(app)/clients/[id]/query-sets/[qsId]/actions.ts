"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addQueryAction(querySetId: string, clientId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) throw new Error("Il testo della query è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("queries").insert({ query_set_id: querySetId, text });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}/query-sets/${querySetId}`);
}

export async function deleteQueryAction(querySetId: string, clientId: string, queryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("queries").delete().eq("id", queryId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}/query-sets/${querySetId}`);
}

// Non si sovrascrive un set di query (vincolo CLAUDE.md sul versionamento):
// attivare una versione archivia semplicemente le altre versioni "active" per
// lo stesso cliente, senza toccarne i dati storici.
export async function activateQuerySetAction(querySetId: string, clientId: string) {
  const supabase = await createClient();

  const { error: archiveError } = await supabase
    .from("query_sets")
    .update({ status: "archived" })
    .eq("client_id", clientId)
    .eq("status", "active");
  if (archiveError) throw new Error(archiveError.message);

  const { error } = await supabase.from("query_sets").update({ status: "active" }).eq("id", querySetId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}/query-sets/${querySetId}`);
  revalidatePath(`/clients/${clientId}`);
}
