import { createClient } from "@/lib/supabase/server";
import { AppShell } from "../../app-shell";
import { Card, Input, Select, Button } from "@/components/ds";
import { createClientAction } from "../actions";

export default async function NewClientPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell activeKey="clienti" userEmail={user?.email ?? null}>
      <div>
        <h1>Nuovo cliente</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Fase 0 — l&rsquo;azienda entra nel ciclo Diagnosi → Misurazione → Intervento → Verifica.
        </p>
      </div>

      <Card style={{ maxWidth: 480 }}>
        <form action={createClientAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input name="name" label="Nome azienda" placeholder="Trattoria del Porto" required />

          <Select
            name="segment"
            label="Segmento"
            defaultValue="locale"
            options={[
              { value: "locale", label: "Locale" },
              { value: "ecommerce", label: "E-commerce" },
              { value: "b2b", label: "B2B / Azienda strutturata" },
            ]}
          />

          <Input name="website_url" label="Sito web" type="url" placeholder="https://..." />

          <Input
            name="logo_url"
            label="Logo (facoltativo)"
            type="url"
            placeholder="https://..."
            hint="Link a un'immagine già online (es. dal sito o dai social del cliente)."
          />

          <Input name="city" label="Città" placeholder="Bologna" />

          <Input name="category" label="Categoria" placeholder="Ristorante, idraulico, agenzia immobiliare…" />

          <Input
            name="aliases"
            label="Alias / nomi alternativi"
            placeholder="Nome commerciale, abbreviazione, vecchia ragione sociale…"
            hint="Separati da virgola. Usati per non perdere citazioni quando il motore AI usa un nome diverso da quello ufficiale."
          />

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
            Crea cliente
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
