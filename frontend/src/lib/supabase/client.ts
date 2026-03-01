/**
 * Browser-side Supabase client for auth operations (signUp, signIn, OTP).
 * Not used for DB queries — all data goes through our FastAPI backend.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  /** Create a Supabase client for browser-side auth operations. */
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
