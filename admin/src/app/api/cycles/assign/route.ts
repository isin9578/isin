import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { guardAdmin, jsonError } from '@/lib/api';
import { assignMemberToCycle, type AssignSlotInput } from '@/lib/data';

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let input: AssignSlotInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await assignMemberToCycle(input);
    revalidatePath('/');
    revalidatePath('/cycles');
    revalidatePath('/members');
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
