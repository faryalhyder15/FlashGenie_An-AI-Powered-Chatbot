import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { login } from "./actions";

export const metadata = { title: "Log in — FlashGenie" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center gradient-warm px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          FlashGenie
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display">Welcome back</CardTitle>
            <CardDescription>Log in to access your flashcard decks.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="login" action={login} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
