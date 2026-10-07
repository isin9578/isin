import { DEMO_ADMIN, isDemoMode } from '@/lib/env';
import { DEMO_ADMIN_ID } from '@/lib/demo/store';

export interface SessionContext {
  userId: string;
  isAdmin: boolean;
}

/** Maps "09171234567" -> internal email used by Supabase password auth. */
export function mobileToEmail(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  return `${digits}@members.isin.local`;
}

/** true when the login identifier is a Philippine mobile number. */
export function isMobileNumber(value: string): boolean {
  return /^0\d{10}$/.test(value.replace(/[\s-]/g, ''));
}

export function resolveLoginEmail(identifier: string): string {
  const trimmed = identifier.trim();
  return isMobileNumber(trimmed) ? mobileToEmail(trimmed) : trimmed;
}

/**
 * Returns the caller's session when they are an authenticated admin.
 * Live mode validates the Supabase session + admin role. Demo mode uses a
 * plain session cookie set by /api/auth/login so the sign-in flow stays real.
 */
export const DEMO_SESSION_COOKIE = 'isin_demo_session';

export async function getSessionContext(): Promise<SessionContext | null> {
  if (isDemoMode()) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const value = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
    return value === 'admin' ? { userId: DEMO_ADMIN_ID, isAdmin: true } : null;
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return { userId: user.id, isAdmin: true };
}

export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx?.isAdmin) {
    throw new UnauthorizedError();
  }
  return ctx;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export const DEMO_ADMIN_CREDENTIALS = DEMO_ADMIN;
