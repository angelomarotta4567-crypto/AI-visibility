"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SEGMENTS = ["locale", "ecommerce", "b2b"] as const;

export async function createClientAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const segment = String(formData.get("segment") ?? "");
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
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
      notes: notes || null,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect(`/clients/${data.id}`);
}
