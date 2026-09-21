"use client";

import { useEffect } from "react";
import { Card, Button } from "@/components/ds";

// Next.js mostra questa pagina al posto della sua schermata tecnica di
// default ("Application error: a client-side exception has occurred") per
// qualunque errore non gestito in un Server/Client Component -- senza
// questo file, un cliente in demo vedrebbe un messaggio in inglese pensato
// per uno sviluppatore, non per lui.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <Card title="Qualcosa è andato storto" style={{ maxWidth: 420 }}>
        <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          Si è verificato un errore imprevisto. Riprova: se il problema persiste, i dati inseriti finora sono al
          sicuro, contatta chi gestisce il programma.
        </p>
        <Button variant="primary" fullWidth onClick={reset}>
          Riprova
        </Button>
      </Card>
    </div>
  );
}
