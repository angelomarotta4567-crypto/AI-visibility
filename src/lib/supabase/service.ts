import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Service-role Supabase client. Bypasses RLS entirely -- only for
 * unattended server-side jobs (measurement cron, engine adapters), never for
 * a request made on behalf of a signed-in user. Importing "server-only"
 * makes any accidental import from a Client Component fail the build. */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
