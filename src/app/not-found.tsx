import Link from "next/link";
import { Card, Button } from "@/components/ds";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "var(--space-4)",
      }}
    >
      <Card title="Pagina non trovata" style={{ maxWidth: 420 }}>
        <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          Il link seguito non corrisponde a nessuna pagina esistente, oppure la risorsa cercata è stata rimossa.
        </p>
        <Link href="/">
          <Button variant="primary" fullWidth>
            Torna ai clienti
          </Button>
        </Link>
      </Card>
    </div>
  );
}
