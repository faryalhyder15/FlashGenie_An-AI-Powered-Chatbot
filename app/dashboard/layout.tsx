import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side guard for everything under /dashboard.
 * Middleware already redirects unauthenticated requests, but this layout
 * double-checks on the server before rendering any private UI or data —
 * defense in depth in case middleware is ever bypassed or misconfigured.
 *
 * No <Navbar> here on purpose: the workspace is a full-screen app shell
 * with its own sidebar (logo, studies list, logout) — a second top nav
 * would duplicate the logo/logout and push the layout taller than the
 * viewport, causing the whole page to scroll instead of just the chat.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}