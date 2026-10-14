"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateQuerySuggestions } from "@/lib/query-generator";

const FROZEN_MESSAGE =
  "Questa versione del set è già stata usata in una misurazione e non si modifica più: cambiare le query renderebbe il confronto prima/dopo non valido. Crea una nuova versione da questa e modifica quella.";

/** Un set già usato in almeno una misurazione è "congelato" (CLAUDE.md, vincolo 4: il set non si sovrascrive, si versiona). */
async function isFrozen(supabase: Awaited<ReturnType<typeof createClient>>, querySetId: string): Promise<boolean> {
  const { count } = await supabase.from("measurement_cycles").select("id", { count: "exact", head: true }).eq("query_set_id", querySetId);
  return (count ?? 0) > 0;
}

export async function addQueryAction(querySetId: string, clientId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) throw new Error("Il testo della query è obbligatorio.");

  const supabase = await createClient();
  if (await isFrozen(supabase, querySetId)) throw new Error(FROZEN_MESSAGE);
  const { error } = await supabase.from("queries").insert({ query_set_id: querySetId, text });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}/query-sets/${querySetId}`);
}

// Suggerimenti generati da template per segmento (CLAUDE.md sezione 4), non
// query definitive: l'utente le rivede/modifica/rimuove nella stessa tabella
// prima di attivare il set. Non duplica query testualmente già presenti.
export async function generateQuerySuggestionsAction(querySetId: string, clientId: string) {
  const supabase = await createClient();
  if (await isFrozen(supabase, querySetId)) throw new Error(FROZEN_MESSAGE);

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

// Errore come dato, non eccezione: in produzione Next nasconde il messaggio delle eccezioni delle server action
// e l'utente vedrebbe solo un generico "riprova".
export async function deleteQueryAction(querySetId: string, clientId: string, queryId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  if (await isFrozen(supabase, querySetId)) return { ok: false, error: FROZEN_MESSAGE };

  const { data, error } = await supabase.from("queries").delete().eq("id", queryId).eq("query_set_id", querySetId).select("id");
  if (error) return { ok: false, error: `Non sono riuscito a rimuovere la query: ${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: "La query non è stata rimossa: non esiste più oppure non hai il permesso. Ricarica la pagina." };

  revalidatePath(`/clients/${clientId}/query-sets/${querySetId}`);
  return { ok: true };
}

// Copia le query di questa versione in una nuova versione in bozza: è il modo corretto per cambiare un set già
// misurato (le misurazioni vecchie restano legate alla versione vecchia). Poi si modificano le query della copia
// e la si attiva.
export async function duplicateQuerySetAction(querySetId: string, clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: latest }, { data: queries, error: queriesError }] = await Promise.all([
    supabase.from("query_sets").select("version").eq("client_id", clientId).order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("queries").select("text, created_at").eq("query_set_id", querySetId).order("created_at"),
  ]);
  if (queriesError) throw new Error(queriesError.message);

  const { data: created, error } = await supabase
    .from("query_sets")
    .insert({ client_id: clientId, version: (latest?.version ?? 0) + 1, status: "draft", created_by: user?.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (queries && queries.length > 0) {
    const { error: insertError } = await supabase.from("queries").insert(queries.map((q) => ({ query_set_id: created.id, text: q.text })));
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}/query-sets/${created.id}`);
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
