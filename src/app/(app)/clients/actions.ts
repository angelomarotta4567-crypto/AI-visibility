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

  revalidatePath("/");
  redirect(`/clients/${data.id}`);
}

// Cancella a cascata competitor, set di query, diagnosi, cicli di misurazione,
// interventi e report di verifica (tutte le foreign key su clients hanno "on
// delete cascade" -- vedi le migration 0003-0007): irreversibile, per questo
// la UI chiede conferma prima di chiamare questa action.
export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}
