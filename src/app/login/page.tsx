"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Input, Button, Badge } from "@/components/ds";
import { sendLoginCodeAction } from "./actions";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "verifying" | "verifying-code" | "code-error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Some Supabase email-template/redirect configs hand back the session in
  // the URL fragment (#access_token=...&refresh_token=...&type=magiclink)
  // instead of going through the /auth/confirm server route (token_hash
  // flow). The fragment never reaches the server, so it has to be picked up
  // and exchanged for a session here, client-side. This has to run in an
  // effect rather than a useState lazy initializer: window.location.hash
  // doesn't exist during the server render, so setting "verifying" state
  // synchronously during the first client render would mismatch the
  // server-rendered (idle/form) HTML and break hydration.
  useEffect(() => {
    if (!window.location.hash) return;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");
    if (!access_token || !refresh_token) return;

    // Strip the tokens from the address bar right away, regardless of outcome.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above the effect
    setStatus("verifying");
    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        console.error("[login] setSession fallito:", error.message);
        setStatus("error");
        setErrorMessage("Il link di accesso non è valido o è scaduto. Richiedi un nuovo codice.");
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const result = await sendLoginCodeAction(email);

    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }
    setStatus("sent");
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setStatus("verifying-code");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });

    if (error) {
      console.error("[login] verifyOtp fallito:", error.message);
      setStatus("code-error");
      setErrorMessage("Codice non valido o scaduto. Controlla di averlo copiato correttamente, oppure richiedine uno nuovo.");
      return;
    }
    router.push("/");
    router.refresh();
  }

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
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span
            style={{
              width: 16,
              height: 16,
              flex: "none",
              borderRadius: 3,
              border: "1.5px solid var(--accent)",
              position: "relative",
            }}
          >
            <span style={{ position: "absolute", left: 2, bottom: 2, width: 3, height: 5, background: "var(--accent)" }} />
            <span style={{ position: "absolute", left: 6, bottom: 2, width: 3, height: 9, background: "var(--accent)" }} />
          </span>
          <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)" }}>AEO</span>
        </div>

        <Card title="Accedi" kicker="Team interno">
          {errorParam ? (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <Badge tone="negative">Il link di accesso non è valido o è scaduto. Riprova.</Badge>
            </div>
          ) : null}

          {status === "verifying" ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)", margin: 0 }}>
              Accesso in corso…
            </p>
          ) : status === "sent" || status === "verifying-code" || status === "code-error" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)", margin: 0 }}>
                Ti abbiamo inviato un&rsquo;email a <strong style={{ color: "var(--text-primary)" }}>{email}</strong> con
                un codice di accesso. Inseriscilo qui sotto.
              </p>
              <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <Input
                  label="Codice di accesso"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="123456"
                  value={code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                  hint={status === "code-error" ? errorMessage ?? undefined : undefined}
                  invalid={status === "code-error"}
                />
                <Button type="submit" variant="primary" fullWidth disabled={status === "verifying-code"}>
                  {status === "verifying-code" ? "Verifica in corso…" : "Verifica codice"}
                </Button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Input
                label="Email"
                type="email"
                required
                placeholder="nome@azienda.it"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                hint={status === "error" ? errorMessage ?? undefined : "Ricevi un codice di accesso via email, nessuna password."}
                invalid={status === "error"}
              />
              <Button type="submit" variant="primary" fullWidth disabled={status === "sending"}>
                {status === "sending" ? "Invio in corso…" : "Invia codice di accesso"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
