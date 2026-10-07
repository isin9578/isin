import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth';

/** Returns a 401 response when the caller is not an admin, else null. */
export async function guardAdmin(): Promise<NextResponse | null> {
  try {
    const ctx = await getSessionContext();
    if (!ctx?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export function jsonError(error: unknown, status = 400): NextResponse {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ error: message }, { status });
}
