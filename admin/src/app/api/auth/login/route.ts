import { NextResponse } from 'next/server';
import { isDemoMode, DEMO_ADMIN } from '@/lib/env';
import { resolveLoginEmail } from '@/lib/auth';
import { jsonError } from '@/lib/api';

export async function POST(request: Request) {
  let body: { identifier?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { identifier, password } = body;
  if (!identifier?.trim() || !password) {
    return NextResponse.json(
      { error: 'Mobile number/email and password are required.' },
      { status: 400 },
    );
  }

  if (isDemoMode()) {
    const email = resolveLoginEmail(identifier);
    if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const { DEMO_SESSION_COOKIE } = await import('@/lib/auth');
      cookieStore.set(DEMO_SESSION_COOKIE, 'admin', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({ ok: true, mode: 'demo' });
    }
    return NextResponse.json(
      { error: `Invalid credentials. Demo admin: ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}` },
      { status: 401 },
    );
  }

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: resolveLoginEmail(identifier),
      password,
    });
    if (error) {
      return NextResponse.json(
        { error: 'Invalid mobile number/email or password.' },
        { status: 401 },
      );
    }
    return NextResponse.json({ ok: true, mode: 'live' });
  } catch (error) {
    return jsonError(error, 500);
  }
}
