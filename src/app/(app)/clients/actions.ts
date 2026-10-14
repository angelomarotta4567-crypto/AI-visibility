"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAliases } from "@/lib/aliases";

const SEGMENTS = ["locale", "ecommerce", "b2b"] as const;

export async function createClientAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const segment = String(formData.get("segment") ?? "");
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const aliases = parseAliases(formData.get("aliases"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) throw new Error("Il nome del cliente è obbligatorio.");
  if (!SEGMENTS.includes(segment as (typeof SEGMENTS)[number])) {
    throw new Error("Segmento non valido.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      segment,
      website_url: websiteUrl || null,
      logo_url: logoUrl || null,
      city: city || null,
      category: category || null,
      aliases,
      notes: notes || null,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

// Cancella il cliente con tutto quello che gli appartiene (competitor, set di
// query, diagnosi, misurazioni, interventi, report): irreversibile, per questo
// la UI chiede conferma prima di chiamare questa action.
//
// Non basta un solo DELETE su clients: i risultati delle misurazioni
// (measurement_run_mentions) puntano ai competitor senza "on delete cascade", e
// i report di verifica ai cicli. Se il database prova a togliere prima i
// competitor, si blocca con un errore di chiave esterna. Si cancella quindi
// prima ciò che punta ad altro (report, interventi, cicli -> run -> menzioni) e
// poi il cliente. L'errore torna come dato: in produzione Next nasconde il
// messaggio delle eccezioni delle server action e la UI non mostrerebbe nulla.
export async function deleteClientAction(clientId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  for (const table of ["verification_reports", "interventions", "measurement_cycles"] as const) {
    const { error } = await supabase.from(table).delete().eq("client_id", clientId);
    if (error) return { ok: false, error: `Non sono riuscito a cancellare ${table}: ${error.message}` };
  }

  // .select() fa tornare le righe cancellate: con le policy RLS un DELETE non permesso non dà errore, cancella
  // zero righe. Senza questo controllo la UI direbbe "fatto" senza aver tolto niente.
  const { data, error } = await supabase.from("clients").delete().eq("id", clientId).select("id");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "Il cliente non è stato eliminato: non esiste più oppure non hai il permesso. Ricarica la pagina e riprova." };

  revalidatePath("/clients");
  return { ok: true };
}
