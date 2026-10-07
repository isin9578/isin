import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { guardAdmin, jsonError } from '@/lib/api';
import { updateMemberStatus } from '@/lib/data';
import type { ProfileStatus } from '@/lib/database.types';

const ALLOWED: ProfileStatus[] = ['pending', 'active', 'suspended'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!body.status || !ALLOWED.includes(body.status as ProfileStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    await updateMemberStatus(id, body.status as ProfileStatus);
    revalidatePath('/');
    revalidatePath('/members');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
