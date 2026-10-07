import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { guardAdmin, jsonError } from '@/lib/api';
import { updateContributionStatus } from '@/lib/data';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  let body: { status?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (body.status !== 'verified' && body.status !== 'failed') {
    return NextResponse.json(
      { error: "Status must be 'verified' or 'failed'" },
      { status: 400 },
    );
  }

  try {
    await updateContributionStatus(id, body.status, body.notes);
    revalidatePath('/');
    revalidatePath('/contributions');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
