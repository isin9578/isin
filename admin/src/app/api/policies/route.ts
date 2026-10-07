import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { guardAdmin, jsonError } from '@/lib/api';
import { upsertPolicy, type PolicyInput } from '@/lib/data';

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let input: PolicyInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await upsertPolicy(input);
    revalidatePath('/');
    revalidatePath('/insurance');
    revalidatePath('/members');
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
