"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use inside Client Components
 * (forms, interactive UI, hooks).
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * from the environment — safe to expose to the browser because
 * Row Level Security (RLS) enforces access control, not this key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
