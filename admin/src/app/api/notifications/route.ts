import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { guardAdmin, jsonError } from '@/lib/api';
import { sendBroadcast, type BroadcastInput } from '@/lib/data';
import type { NotificationType } from '@/lib/database.types';

const ALLOWED: NotificationType[] = [
  'contribution_reminder',
  'schedule_update',
  'payment_alert',
  'announcement',
];

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let input: BroadcastInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!ALLOWED.includes(input.type)) {
    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
  }

  try {
    const count = await sendBroadcast(input);
    revalidatePath('/');
    revalidatePath('/notifications');
    return NextResponse.json({ ok: true, delivered: count }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
