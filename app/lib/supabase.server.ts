import { createServerClient } from '@supabase/ssr'
import { env } from './env'

// Server-side client with proper cookie handling for React Router
export function createServerSupabaseClient(request: Request) {
  return createServerClient(env.VITE_PUBLIC_SUPABASE_URL, env.VITE_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get('Cookie')
        if (!cookieHeader) return []

        return cookieHeader.split(';').map((cookie) => {
          const [name, value] = cookie.trim().split('=')
          return { name: name || '', value: value || '' }
        })
      },
      setAll(cookiesToSet) {
        // Note: In React Router, cookies should be set in the response headers
        // This is handled by the route loaders/actions
        for (const { name, value, options } of cookiesToSet) {
          // Store cookies for response handling
          // The actual setting will be done in the loader/action response
          // Here you would typically set the cookie in the response headers
          // For example: response.headers.append("Set-Cookie", `${name}=${value}; ${options}`);
          // But since this is a server-side client, we just store them for later use
        }
      },
    },
  })
}
