import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton — instantiated on first call, not at module load, so next build
// can evaluate this module without SUPABASE_* env vars present.
let _admin: SupabaseClient | null = null;

/**
 * Returns the service-role Supabase admin client.
 *
 * Bypasses RLS — only call this in trusted server contexts (Server Actions,
 * Route Handlers, background jobs). Never pass it to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local."
      );
    }
    _admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _admin;
}
