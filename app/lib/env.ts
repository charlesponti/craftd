import { z } from "zod";

// Server-only environment variables (never sent to client)
const serverEnvSchema = z.object({
  VITE_DATABASE_URL: z.string().url(),
});

// Client-accessible environment variables (prefixed with VITE_PUBLIC_)
const clientEnvSchema = z.object({
  VITE_PUBLIC_SUPABASE_URL: z.string().url(),
  VITE_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Combined schema for server-side usage
const serverCombinedSchema = serverEnvSchema.merge(clientEnvSchema);

// Type definitions
type ClientEnv = z.infer<typeof clientEnvSchema>;
type ServerEnv = z.infer<typeof serverCombinedSchema>;

// Client-side environment cache
let clientEnvCache: ClientEnv | null = null;

// Handle environment variables for both client and server contexts
function getEnvironmentVariables(): ClientEnv | ServerEnv {
  // Check if we're in a browser/client context
  const isClient = typeof window !== "undefined";

  if (isClient) {
    // Client-side: Return cached values if available, otherwise return empty defaults
    // The actual values will be loaded asynchronously by the useClientEnv hook
    if (clientEnvCache) {
      return clientEnvCache;
    }

    // Return default values that will cause validation errors - this forces proper loading
    return {
      VITE_PUBLIC_SUPABASE_URL: "",
      VITE_PUBLIC_SUPABASE_ANON_KEY: "",
    };
  }

  // Server-side: get all variables
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Production: use process.env to get fly.io runtime secrets
    return serverCombinedSchema.parse({
      VITE_DATABASE_URL:
        process.env.VITE_DATABASE_URL || process.env.DATABASE_URL,
      VITE_PUBLIC_SUPABASE_URL: process.env.VITE_PUBLIC_SUPABASE_URL,
      VITE_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
    });
  }

  // Development: prefer import.meta.env, fallback to process.env
  const envSource =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : process.env;

  return serverCombinedSchema.parse({
    VITE_DATABASE_URL: envSource.VITE_DATABASE_URL || envSource.DATABASE_URL,
    VITE_PUBLIC_SUPABASE_URL:
      envSource.VITE_PUBLIC_SUPABASE_URL || envSource.SUPABASE_URL,
    VITE_PUBLIC_SUPABASE_ANON_KEY:
      envSource.VITE_PUBLIC_SUPABASE_ANON_KEY || envSource.SUPABASE_ANON_KEY,
  });
}

export const env = getEnvironmentVariables();

// Helper function to safely access server-only env vars
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() can only be called on the server side");
  }
  return env as ServerEnv;
}

// Client-side hook to load environment variables asynchronously
export async function loadClientEnv(): Promise<ClientEnv> {
  if (typeof window === "undefined") {
    throw new Error("loadClientEnv() can only be called on the client side");
  }

  if (clientEnvCache) {
    return clientEnvCache;
  }

  try {
    const response = await fetch("/api/env");
    if (!response.ok) {
      throw new Error("Failed to load environment variables");
    }
    const envData = await response.json();
    clientEnvCache = clientEnvSchema.parse(envData);
    return clientEnvCache;
  } catch (error) {
    console.error("Failed to load client environment variables:", error);
    throw error;
  }
}
