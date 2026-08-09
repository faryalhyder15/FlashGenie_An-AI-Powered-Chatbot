import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { signup } from "./actions";

export const metadata = { title: "Sign up — FlashGenie" };

export default function SignupPage() {
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
            <CardTitle className="font-display">Create your account</CardTitle>
            <CardDescription>Start turning notes into flashcards in minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="signup" action={signup} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
