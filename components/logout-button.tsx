"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
      Logout
    </Button>
  );
}