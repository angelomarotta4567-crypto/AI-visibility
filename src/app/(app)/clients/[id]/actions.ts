"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addCompetitorAction(clientId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!name) throw new Error("Il nome del competitor è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("competitors").insert({
    client_id: clientId,
    name,
    url: url || null,
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
