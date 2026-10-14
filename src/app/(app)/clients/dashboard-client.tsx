"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, DataTable, Dialog } from "@/components/ds";
import { AppShell } from "../app-shell";
import { SEGMENT_LABEL } from "@/lib/segments";
import { CLIENT_STATUS_LABEL } from "@/lib/status-labels";
import { deleteClientAction } from "./actions";
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function askDelete(e: React.MouseEvent, client: ClientRow) {
    e.stopPropagation();
    setDeleteError(null);
    setPendingDelete(client);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    setDeleteError(null);
    try {
      const res = await deleteClientAction(pendingDelete.id);
      if (!res.ok) {
        setDeleteError(res.error);
        return;
      }
      setPendingDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Non sono riuscito a contattare il server. Riprova tra un minuto.");
    } finally {
      setDeletingId(null);
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
        // Il Dialog del design system è "absolute": senza questo contenitore fisso compare in cima alla
        // pagina e, con la lista scorsa verso il basso, non si vede (sembra che Elimina non faccia nulla).
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <Dialog
            title={`Eliminare "${pendingDelete.name}"?`}
            description="Cancella anche tutta la sua diagnosi, le misurazioni, gli interventi e i report collegati. Non si può annullare."
            onClose={() => setPendingDelete(null)}
            footer={
              <>
                <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deletingId === pendingDelete.id}>
                  Annulla
                </Button>
                <Button variant="danger" onClick={confirmDelete} disabled={deletingId === pendingDelete.id}>
                  {deletingId === pendingDelete.id ? "Elimino…" : "Elimina definitivamente"}
                </Button>
              </>
            }
          >
            {deleteError ? (
              <p role="alert" style={{ margin: 0, color: "var(--data-negative)", fontSize: "var(--text-sm)" }}>
                {deleteError}
              </p>
            ) : null}
          </Dialog>
        </div>
      ) : null}
    </AppShell>
  );
}
