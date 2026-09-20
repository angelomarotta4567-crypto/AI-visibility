import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmClient } from "./confirm-client";

// Matches the default Supabase magic-link/email template
// (${SITE_URL}/auth/confirm?token_hash=...&type=email), when that template
// is used. When it's not -- as observed against this project, which routes
// through Supabase's hosted /auth/v1/verify and redirects here with the
// session in the URL fragment instead -- fall through to the client-side
// handler in confirm-client.tsx.
export default async function AuthConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const params = await searchParams;
  const token_hash = params.token_hash;
  const type = params.type as EmailOtpType | undefined;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    redirect(error ? "/login?error=confirm_failed" : (params.next ?? "/"));
  }

  return <ConfirmClient />;
}
