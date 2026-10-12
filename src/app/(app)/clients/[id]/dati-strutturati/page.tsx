import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/(app)/app-shell";
import { StructuredDataTool } from "./tool";

export default async function StructuredDataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: user }, { data: client }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from("clients").select("id, name, website_url, city").eq("id", id).maybeSingle(),
  ]);

  if (!client) notFound();

  return (
    <AppShell activeKey="clienti" userEmail={user?.email ?? null}>
      <div>
        <Link href={`/clients/${id}`} style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          ← {client.name}
        </Link>
        <h1 style={{ marginTop: "var(--space-2)" }}>Dati strutturati e coerenza</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)", maxWidth: "75ch" }}>
          Scrivi una volta i dati ufficiali dello studio: il software prepara il blocco per il sito e controlla che sito e profili pubblici dicano le stesse cose.
        </p>
      </div>

      <StructuredDataTool clientId={id} clientName={client.name} websiteUrl={client.website_url ?? ""} city={client.city ?? ""} />
    </AppShell>
  );
}
