"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateQuerySuggestions } from "@/lib/query-generator";

export async function addQueryAction(querySetId: string, clientId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) throw new Error("Il testo della query è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("queries").insert({ query_set_id: querySetId, text });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}/query-sets/${querySetId}`);
}

// Suggerimenti generati da template per segmento (CLAUDE.md sezione 4), non
// query definitive: l'utente le rivede/modifica/rimuove nella stessa tabella
// prima di attivare il set. Non duplica query testualmente già presenti.
export async function generateQuerySuggestionsAction(querySetId: string, clientId: string) {
  const supabase = await createClient();

  const [{ data: client, error: clientError }, { data: existing }] = await Promise.all([
    supabase.from("clients").select("name, segment, city, category").eq("id", clientId).single(),
    supabase.from("queries").select("text").eq("query_set_id", querySetId),
  ]);

  if (clientError) throw new Error(clientError.message);
  if (!client) throw new Error("Cliente non trovato.");

  const suggestions = generateQuerySuggestions({
    name: client.name,
    segment: client.segment,
    city: client.city ?? null,
    category: client.category ?? null,
  });

  const existingNormalized = new Set((existing ?? []).map((q) => q.text.trim().toLowerCase()));
  const toInsert = suggestions.filter((s) => !existingNormalized.has(s.toLowerCase()));

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("queries")
      .insert(toInsert.map((text) => ({ query_set_id: querySetId, text })));
    if (error) throw new Error(error.message);
  }

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
