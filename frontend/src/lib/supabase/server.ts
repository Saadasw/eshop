/**
 * Server-side Supabase client for SSR auth token handling.
 * Uses Next.js cookies() API (async in Next.js 16).
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  /** Create a Supabase client for server-side auth token handling. */
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from a Server Component where cookies
            // cannot be set. This is safe to ignore when the middleware
            // refreshes the session.
          }
        },
      },
    },
  );
}
