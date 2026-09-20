import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Supabase client for use in Server Components, Server Actions and Route
 * Handlers. Uses the anon key + the request's session cookie, so queries go
 * through RLS as the currently signed-in user. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component (no cookie write access). Safe
            // to ignore as long as middleware.ts is refreshing the session.
          }
        },
      },
    },
  );
}
