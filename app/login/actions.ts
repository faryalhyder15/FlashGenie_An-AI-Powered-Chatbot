"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations";
import type { ActionResult } from "@/types";

/**
 * Server Action for the login form.
 * Re-validates on the server (never trust the client), maps Supabase's
 * raw error messages to friendly copy, and redirects on success.
 */
export async function login(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please check your input.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase returns "Invalid login credentials" for both wrong email
    // and wrong password — keep that ambiguity for security reasons.
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return { success: false, message: "Incorrect email or password." };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        success: false,
        message: "Please confirm your email before logging in.",
      };
    }
    return { success: false, message: error.message };
  }

  redirect("/dashboard");
}
