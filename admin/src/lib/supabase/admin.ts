import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getSupabaseAnonKey, getSupabaseUrl, getServiceRoleKey } from '@/lib/env';

/**
 * Service-role client for privileged admin operations (creating member
 * accounts, writing to any table). Server-side only — never expose the key
 * to the browser. Every caller is gated by requireAdmin() in the route/page.
 */
export function createAdminClient() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey() ?? getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error('Supabase is not configured.');
  }
  if (!getServiceRoleKey()) {
    console.warn(
      '[iSIN] SUPABASE_SERVICE_ROLE_KEY is not set — admin writes will be rejected by RLS.',
    );
  }
  return createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
