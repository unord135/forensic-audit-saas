import { createBrowserClient } from "@supabase/ssr";

// Module-level singleton — like a global `db` in Python scripts.
// Only use this inside 'use client' components.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
