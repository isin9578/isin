import { NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/env';

export async function POST() {
  if (isDemoMode()) {
    const { cookies } = await import('next/headers');
    const { DEMO_SESSION_COOKIE } = await import('@/lib/auth');
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_SESSION_COOKIE);
  } else {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
