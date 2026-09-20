"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Supabase's hosted /auth/v1/verify redirected here with the session in the
// URL fragment (#access_token=...&refresh_token=...) instead of a
// token_hash query param -- fragments never reach the server, so the
// exchange has to happen client-side, here.
export function ConfirmClient() {
  const router = useRouter();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");

    if (!access_token || !refresh_token) {
      router.replace("/login?error=confirm_failed");
      return;
    }

    // Strip the tokens from the address bar right away, regardless of outcome.
    window.history.replaceState(null, "", window.location.pathname);

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      router.replace(error ? "/login?error=confirm_failed" : "/");
      router.refresh();
    });
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
      }}
    >
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>Accesso in corso…</p>
    </div>
  );
}
