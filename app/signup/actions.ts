"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validations";
import type { ActionResult } from "@/types";

/**
 * Server Action for the signup form.
 * Creates the Supabase auth user with `fullName` stored in user_metadata.
 */
export async function signup(formData: FormData): Promise<ActionResult> {
  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please check your input.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { success: false, message: "An account with this email already exists." };
    }
    return { success: false, message: error.message };
  }

  // If "Confirm email" is enabled in Supabase Auth settings, signUp()
  // succeeds but returns no session until the user clicks the email link.
  if (!data.session) {
    return {
      success: true,
      message: "Account created! Check your email to confirm before logging in.",
    };
  }

  redirect("/dashboard");
}
