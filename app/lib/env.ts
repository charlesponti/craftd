import { z } from "zod";

const envSchema = z.object({
  VITE_DATABASE_URL: z.string().url(),
  VITE_PUBLIC_SUPABASE_URL: z.string().url(),
  VITE_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Add any other required env vars here
});

// Prefer import.meta.env (Vite), fallback to process.env (Node)
export const env = envSchema.parse(
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : process.env
);
