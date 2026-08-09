"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Mail, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { loginSchema, signUpSchema, type LoginInput, type SignUpInput } from "@/lib/validations";
import type { ActionResult } from "@/types";

type Mode = "login" | "signup";

interface AuthFormProps {
  mode: Mode;
  action: (formData: FormData) => Promise<ActionResult>;
}

/**
 * Single reusable form for both /login and /signup.
 * - Client-side validation via zod (fast feedback, no round trip).
 * - Submits to a Server Action, which re-validates and talks to Supabase.
 * - Surfaces server errors (wrong password, email already exists, etc.)
 *   inline instead of a raw thrown error.
 */
export function AuthForm({ mode, action }: AuthFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverNotice, setServerNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const schema = mode === "signup" ? signUpSchema : loginSchema;

  const form = useForm<LoginInput | SignUpInput>({
    resolver: zodResolver(schema as any),
    defaultValues:
      mode === "signup"
        ? { fullName: "", email: "", password: "", confirmPassword: "" }
        : { email: "", password: "" },
  });

  function onSubmit(values: LoginInput | SignUpInput) {
    setServerError(null);
    setServerNotice(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value as string));

    startTransition(async () => {
      try {
        const result = await action(formData);
        if (!result.success) {
          setServerError(result.message ?? "Something went wrong. Please try again.");
        } else if (result.message) {
          // Success, but nothing to redirect to yet (e.g. "confirm your email").
          setServerNotice(result.message);
        }
        // Otherwise the server action performed a redirect already.
      } catch (err) {
        setServerError(
          "Network error — please check your connection and try again."
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {serverNotice && (
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverNotice}</span>
          </div>
        )}

        {mode === "signup" && (
          <FormField
            control={form.control}
            name={"fullName" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Jane Doe" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" placeholder="you@example.com" className="pl-9" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-9" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === "signup" && (
          <FormField
            control={form.control}
            name={"confirmPassword" as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Spinner />}
          {mode === "signup" ? "Create account" : "Log in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </>
          )}
        </p>
      </form>
    </Form>
  );
}
