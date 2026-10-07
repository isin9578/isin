import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { guardAdmin, jsonError } from '@/lib/api';
import { updateClaimStatus } from '@/lib/data';
import type { ClaimStatus } from '@/lib/database.types';

const ALLOWED: ClaimStatus[] = ['submitted', 'under_review', 'approved', 'rejected'];

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

  if (!body.status || !ALLOWED.includes(body.status as ClaimStatus)) {
    return NextResponse.json({ error: 'Invalid claim status' }, { status: 400 });
  }

  try {
    await updateClaimStatus(id, body.status as ClaimStatus);
    revalidatePath('/');
    revalidatePath('/insurance');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
