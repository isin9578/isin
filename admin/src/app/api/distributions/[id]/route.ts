import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { guardAdmin, jsonError } from '@/lib/api';
import { disburseDistribution } from '@/lib/data';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  let body: { reference_number?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await disburseDistribution(id, body.reference_number?.trim() || undefined);
    revalidatePath('/');
    revalidatePath('/distributions');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
