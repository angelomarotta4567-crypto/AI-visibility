import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Defense in depth alongside middleware.ts: middleware already redirects
// signed-out visitors, this guard covers direct server-side renders too.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return children;
}
