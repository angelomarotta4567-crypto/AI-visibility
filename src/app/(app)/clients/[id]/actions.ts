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
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
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
      logo_url: logoUrl || null,
      city: city || null,
      category: category || null,
      aliases,
      notes: notes || null,
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/clients");
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

function hostnameOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Serve soprattutto per attività dello stesso settore/zona (es. i dentisti di
// Dalmine): evita di reinserire a mano gli stessi 11 concorrenti e le stesse
// 20 query per ogni nuovo cliente simile.
export async function copyFromClientAction(clientId: string, formData: FormData) {
  const sourceClientId = String(formData.get("source_client_id") ?? "");
  if (!sourceClientId) throw new Error("Seleziona un cliente da cui copiare.");
  if (sourceClientId === clientId) throw new Error("Non puoi copiare da un cliente su se stesso.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: target }, { data: source }, { data: sourceCompetitors }, { data: existingCompetitors }] = await Promise.all([
    supabase.from("clients").select("name, website_url").eq("id", clientId).single(),
    supabase.from("clients").select("name, website_url").eq("id", sourceClientId).single(),
    supabase.from("competitors").select("name, url, aliases").eq("client_id", sourceClientId),
    supabase.from("competitors").select("name").eq("client_id", clientId),
  ]);
  if (!target || !source) throw new Error("Cliente non trovato.");

  // Il cliente stesso va escluso dalla lista di concorrenti copiata, per
  // nome o per dominio -- capita quando due attività simili si citano a
  // vicenda come concorrenti l'una dell'altra.
  const targetName = target.name.trim().toLowerCase();
  const targetHostname = hostnameOf(target.website_url);
  const existingNames = new Set((existingCompetitors ?? []).map((c) => c.name.trim().toLowerCase()));

  const competitorsToInsert = (sourceCompetitors ?? [])
    .filter((c) => c.name.trim().toLowerCase() !== targetName)
    .filter((c) => !targetHostname || hostnameOf(c.url) !== targetHostname)
    .filter((c) => !existingNames.has(c.name.trim().toLowerCase()))
    .map((c) => ({ client_id: clientId, name: c.name, url: c.url, aliases: c.aliases ?? [] }));

  if (competitorsToInsert.length > 0) {
    const { error } = await supabase.from("competitors").insert(competitorsToInsert);
    if (error) throw new Error(error.message);
  }

  const { data: sourceQuerySet } = await supabase
    .from("query_sets")
    .select("id")
    .eq("client_id", sourceClientId)
    .eq("status", "active")
    .maybeSingle();

  if (sourceQuerySet) {
    const { data: sourceQueries } = await supabase.from("queries").select("text").eq("query_set_id", sourceQuerySet.id);

    const { data: latest } = await supabase
      .from("query_sets")
      .select("version")
      .eq("client_id", clientId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (latest?.version ?? 0) + 1;

    // Non si sovrascrive un set esistente (vincolo di versionamento): la
    // copia crea una nuova versione e archivia le altre versioni attive,
    // stesso comportamento di activateQuerySetAction.
    await supabase.from("query_sets").update({ status: "archived" }).eq("client_id", clientId).eq("status", "active");

    const { data: newQuerySet, error: qsError } = await supabase
      .from("query_sets")
      .insert({ client_id: clientId, version: nextVersion, status: "active", created_by: user?.id })
      .select("id")
      .single();
    if (qsError) throw new Error(qsError.message);

    if (sourceQueries && sourceQueries.length > 0) {
      const { error: qError } = await supabase
        .from("queries")
        .insert(sourceQueries.map((q) => ({ query_set_id: newQuerySet.id, text: q.text })));
      if (qError) throw new Error(qError.message);
    }
  }

  revalidatePath(`/clients/${clientId}`);
}
