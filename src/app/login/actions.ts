"use server";

import { createServiceClient } from "@/lib/supabase/service";

// Bypassa il mailer di Supabase (il rendering dei template email era rotto
// per un incidente della piattaforma il 2026-09-21, confermato via banner
// di stato e via lettura diretta del template salvato): generiamo l'OTP con
// l'Admin API di Supabase e mandiamo noi l'email via Resend, direttamente.
// La verifica del codice resta su Supabase (supabase.auth.verifyOtp), che
// non dipende dal mailer -- solo l'invio dell'email è sotto il nostro
// controllo ora.
export async function sendLoginCodeAction(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { ok: false, error: "Email obbligatoria." };

  const GENERIC_ERROR = "Invio del codice non riuscito. Riprova tra qualche istante.";
  const supabase = createServiceClient();

  // Invite-only: solo chi ha già un profilo (è stato invitato) può ricevere
  // un codice -- stessa regola che aveva shouldCreateUser: false prima.
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("[login] listUsers fallito:", listError.message);
    return { ok: false, error: GENERIC_ERROR };
  }
  const user = usersData.users.find((u) => u.email?.toLowerCase() === trimmedEmail);
  if (!user) return { ok: false, error: "Nessun utente invitato con questa email." };

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: trimmedEmail,
  });
  if (error) {
    console.error("[login] generateLink fallito:", error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const code = data.properties.email_otp;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[login] RESEND_API_KEY non configurata.");
    return { ok: false, error: GENERIC_ERROR };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AI Visibility <onboarding@resend.dev>",
      to: [trimmedEmail],
      subject: "Il tuo codice di accesso",
      html: `<h2>Il tuo codice di accesso</h2><p>Inserisci questo codice nella pagina di login:</p><p style="font-size:28px;font-weight:600;letter-spacing:2px;">${code}</p><p>Scade tra un'ora. Se non hai richiesto tu l'accesso, ignora questa email.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[login] invio email Resend fallito (${res.status}):`, body.slice(0, 500));
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true };
}
