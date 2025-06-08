import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export async function createClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "Supabase client requires browser environment and ENV variables"
    );
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
