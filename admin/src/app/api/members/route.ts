import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { guardAdmin, jsonError } from '@/lib/api';
import { registerMember, type MemberInput } from '@/lib/data';

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let input: MemberInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const member = await registerMember(input);
    revalidatePath('/');
    revalidatePath('/members');
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
