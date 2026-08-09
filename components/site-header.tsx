import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";

/**
 * Server component that resolves the current session once,
 * then hands a plain boolean down to the client Navbar.
 * Keeps Supabase session-reading logic out of client bundles.
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <Navbar isAuthed={!!user} />;
}
