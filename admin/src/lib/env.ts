/**
 * Environment detection.
 *
 * When NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are configured,
 * the panel talks to the real Supabase backend (with RLS + service-role admin
 * actions). Otherwise it runs in DEMO MODE against an in-memory fixture store
 * so the whole UI is reviewable without a provisioned backend.
 */

const PLACEHOLDERS = new Set([
  '',
  'your-project.supabase.co',
  'https://your-project.supabase.co',
  'your-anon-key',
]);

function read(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  return PLACEHOLDERS.has(value.trim()) ? undefined : value.trim();
}

export function getSupabaseUrl(): string | undefined {
  return read('NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string | undefined {
  return read('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function getServiceRoleKey(): string | undefined {
  return read('SUPABASE_SERVICE_ROLE_KEY');
}

/** True when no real Supabase project is configured. */
export function isDemoMode(): boolean {
  return !getSupabaseUrl() || !getSupabaseAnonKey();
}

/** Demo admin credentials (also documented in the repo README). */
export const DEMO_ADMIN = {
  email: 'admin@isin.ph',
  password: 'Admin123!',
  fullName: 'System Admin',
};
