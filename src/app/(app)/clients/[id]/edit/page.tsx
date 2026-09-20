import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/(app)/app-shell";
import { Card, Input, Select, Button } from "@/components/ds";
import { updateClientAction } from "../actions";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: user }, { data: client }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
  ]);

  if (!client) notFound();

  const updateClient = updateClientAction.bind(null, id);

  return (
    <AppShell activeKey="clienti" userEmail={user?.email ?? null}>
      <div>
        <Link href={`/clients/${id}`} style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          ← {client.name}
        </Link>
        <h1 style={{ marginTop: "var(--space-2)" }}>Modifica cliente</h1>
      </div>

      <Card style={{ maxWidth: 480 }}>
        <form action={updateClient} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input name="name" label="Nome azienda" defaultValue={client.name} required />

          <Select
            name="segment"
            label="Segmento"
            defaultValue={client.segment}
            options={[
              { value: "locale", label: "Locale" },
              { value: "ecommerce", label: "E-commerce" },
              { value: "b2b", label: "B2B / Azienda strutturata" },
            ]}
          />

          <Select
            name="status"
            label="Stato"
            defaultValue={client.status}
            options={[
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "archived", label: "Archived" },
            ]}
          />

          <Input name="website_url" label="Sito web" type="url" defaultValue={client.website_url ?? ""} placeholder="https://..." />

          <label style={{ display: "block" }}>
            <span
              style={{
                display: "block",
                marginBottom: "var(--space-2)",
                fontSize: "var(--text-xs)",
                color: "var(--text-secondary)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              Note
            </span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={client.notes ?? ""}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "var(--space-3)",
                background: "var(--surface-1)",
                color: "var(--text-primary)",
                border: "var(--border-width) solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-base)",
                letterSpacing: "var(--tracking-tight)",
              }}
            />
          </label>

          <Button type="submit" variant="primary" fullWidth>
            Salva modifiche
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
