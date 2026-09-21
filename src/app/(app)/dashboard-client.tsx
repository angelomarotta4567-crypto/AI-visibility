"use client";

import { useRouter } from "next/navigation";
import { Card, Badge, Button, DataTable } from "@/components/ds";
import { AppShell } from "./app-shell";
import { SEGMENT_LABEL } from "@/lib/segments";
import { CLIENT_STATUS_LABEL } from "@/lib/status-labels";

export type ClientRow = {
  id: string;
  name: string;
  segment: string;
  status: string;
  created_at: string;
};

export function DashboardClient({ clients, userEmail }: { clients: ClientRow[]; userEmail: string | null }) {
  const router = useRouter();

  return (
    <AppShell activeKey="clienti" userEmail={userEmail}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Clienti</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>Workspace del team — dati reali da Supabase</p>
        </div>
        <Button variant="primary" iconLeft="plus" onClick={() => router.push("/clients/new")}>
          Nuovo cliente
        </Button>
      </div>

      <Card title="Clienti monitorati" kicker={`${clients.length} totali`} padding="none">
        {clients.length === 0 ? (
          <div style={{ padding: "var(--space-6)", color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
            Nessun cliente ancora. Crea il primo cliente per iniziare il ciclo Diagnosi → Misurazione → Intervento →
            Verifica.
          </div>
        ) : (
          <DataTable
            columns={[
              { key: "name", header: "Nome" },
              {
                key: "segment",
                header: "Segmento",
                render: (r: ClientRow) => <Badge tone="accent">{SEGMENT_LABEL[r.segment] ?? r.segment}</Badge>,
              },
              {
                key: "status",
                header: "Stato",
                render: (r: ClientRow) => (
                  <Badge tone={r.status === "active" ? "positive" : r.status === "paused" ? "warning" : "neutral"}>
                    {CLIENT_STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                ),
              },
              {
                key: "created_at",
                header: "Creato il",
                render: (r: ClientRow) => new Date(r.created_at).toLocaleDateString("it-IT"),
              },
            ]}
            rows={clients}
            onRowClick={(r: ClientRow) => router.push(`/clients/${r.id}`)}
          />
        )}
      </Card>
    </AppShell>
  );
}
