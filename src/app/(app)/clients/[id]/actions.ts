"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAliases } from "@/lib/aliases";

const SEGMENTS = ["locale", "ecommerce", "b2b"] as const;
const STATUSES = ["active", "paused", "archived"] as const;

export async function updateClientAction(clientId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const segment = String(formData.get("segment") ?? "");
  const status = String(formData.get("status") ?? "");
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const aliases = parseAliases(formData.get("aliases"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) throw new Error("Il nome del cliente è obbligatorio.");
  if (!SEGMENTS.includes(segment as (typeof SEGMENTS)[number])) throw new Error("Segmento non valido.");
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) throw new Error("Stato non valido.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name,
      segment,
      status,
      website_url: websiteUrl || null,
      city: city || null,
      category: category || null,
      aliases,
      notes: notes || null,
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function addCompetitorAction(clientId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const aliases = parseAliases(formData.get("aliases"));
  if (!name) throw new Error("Il nome del competitor è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("competitors").insert({
    client_id: clientId,
    name,
    url: url || null,
    aliases,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteCompetitorAction(clientId: string, competitorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("competitors").delete().eq("id", competitorId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

export async function createQuerySetAction(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: latest } = await supabase
    .from("query_sets")
    .select("version")
    .eq("client_id", clientId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version ?? 0) + 1;

  const { error } = await supabase.from("query_sets").insert({
    client_id: clientId,
    version: nextVersion,
    status: "draft",
    created_by: user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}
