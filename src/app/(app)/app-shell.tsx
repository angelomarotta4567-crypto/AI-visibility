"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar, Button } from "@/components/ds";

const SECTIONS = [
  {
    title: "Workspace",
    items: [{ key: "clienti", label: "Clienti", icon: "users" }],
  },
  {
    title: "Ciclo",
    items: [
      { key: "diagnosi", label: "Diagnosi", icon: "stethoscope" },
      { key: "misurazione", label: "Misurazione", icon: "bar-chart-3" },
      { key: "intervento", label: "Intervento", icon: "wrench" },
      { key: "verifica", label: "Verifica", icon: "check-check" },
    ],
  },
];

const PHASE_ROUTES: Record<string, string> = {
  clienti: "/",
  diagnosi: "/diagnosi",
  misurazione: "/misurazione",
  intervento: "/intervento",
  verifica: "/verifica",
};

/** Shared chrome (sidebar + sign out) for every page under (app)/. Each
 * "Ciclo" item is a cross-client overview page for that phase; the
 * per-client detail lives on /clients/[id]. */
export function AppShell({
  activeKey = "clienti",
  userEmail,
  children,
}: {
  activeKey?: string;
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Sidebar
        brand="AEO"
        activeKey={activeKey}
        onNavigate={(key: string) => {
          const path = PHASE_ROUTES[key];
          if (path) router.push(path);
        }}
        sections={SECTIONS}
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {userEmail ? (
              <div
                style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-tertiary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userEmail}
              </div>
            ) : null}
            <Button variant="ghost" size="sm" iconLeft="log-out" onClick={handleSignOut}>
              Esci
            </Button>
          </div>
        }
      />

      <main style={{ flex: 1, padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {children}
      </main>
    </div>
  );
}
