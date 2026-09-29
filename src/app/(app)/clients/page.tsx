import { createClient } from "@/lib/supabase/server";
import { DashboardClient, type ClientRow } from "./dashboard-client";

export default async function Home() {
  const supabase = await createClient();

  const [{ data: clients }, { data: userData }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, segment, status, created_at, logo_url")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  return <DashboardClient clients={(clients ?? []) as ClientRow[]} userEmail={userData.user?.email ?? null} />;
}
