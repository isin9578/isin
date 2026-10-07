import { createServerClient as createSsrsClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env';

/**
 * User-scoped Supabase client for Server Components / Route Handlers.
 * Reads through this client are protected by Row Level Security.
 */
export async function createClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured (demo mode uses lib/data instead).');
  }

  const cookieStore = await cookies();

  return createSsrsClient<Database>(url, anonKey, {
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
          // Called from a Server Component — refresh is handled by middleware.
        }
      },
    },
  });
}
