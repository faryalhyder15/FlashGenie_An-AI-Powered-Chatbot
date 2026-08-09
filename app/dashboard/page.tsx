import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MainWorkspace } from "@/components/workspace/main-workspace";

export const metadata = { title: "Workspace — FlashGenie" };

export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <main className="h-screen w-screen overflow-hidden flex bg-background">
      <MainWorkspace
        userId={user.id}
        initialConversations={conversations || []}
      />
    </main>
  );
}