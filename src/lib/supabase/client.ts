import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for use in Client Components. Uses the anon key; every
 * query it makes goes through RLS as the currently signed-in user. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
