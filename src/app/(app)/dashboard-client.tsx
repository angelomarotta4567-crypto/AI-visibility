"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, DataTable, Dialog } from "@/components/ds";
import { AppShell } from "./app-shell";
import { SEGMENT_LABEL } from "@/lib/segments";
import { CLIENT_STATUS_LABEL } from "@/lib/status-labels";
import { deleteClientAction } from "./clients/actions";
import { ClientAvatar } from "@/components/client-avatar";

export type ClientRow = {
  id: string;
  name: string;
  segment: string;
  status: string;
  created_at: string;
  logo_url: string | null;
};

export function DashboardClient({ clients, userEmail }: { clients: ClientRow[]; userEmail: string | null }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClientRow | null>(null);

  function askDelete(e: React.MouseEvent, client: ClientRow) {
    e.stopPropagation();
    setPendingDelete(client);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await deleteClientAction(pendingDelete.id);
      router.refresh();
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

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
              {
                key: "name",
                header: "Nome",
                render: (r: ClientRow) => (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <ClientAvatar name={r.name} logoUrl={r.logo_url} />
                    <span>{r.name}</span>
                  </div>
                ),
              },
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
              {
                key: "actions",
                header: "",
                align: "right",
                render: (r: ClientRow) => (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    iconLeft="trash-2"
                    aria-label={`Elimina ${r.name}`}
                    disabled={deletingId === r.id}
                    onClick={(e: React.MouseEvent) => askDelete(e, r)}
                  >
                    {deletingId === r.id ? "Elimino…" : "Elimina"}
                  </Button>
                ),
              },
            ]}
            rows={clients}
            onRowClick={(r: ClientRow) => router.push(`/clients/${r.id}`)}
          />
        )}
      </Card>
      {pendingDelete ? (
        <Dialog
          title={`Eliminare "${pendingDelete.name}"?`}
          description="Cancella anche tutta la sua diagnosi, le misurazioni, gli interventi e i report collegati. Non si può annullare."
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setPendingDelete(null)}>
                Annulla
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deletingId === pendingDelete.id}>
                {deletingId === pendingDelete.id ? "Elimino…" : "Elimina definitivamente"}
              </Button>
            </>
          }
        />
      ) : null}
    </AppShell>
  );
}
