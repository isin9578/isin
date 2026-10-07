'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui';
import { apiCall } from '@/lib/client';
import type { NotificationType } from '@/lib/database.types';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100';

const TYPES: { value: NotificationType; label: string }[] = [
  { value: 'contribution_reminder', label: 'Contribution reminder' },
  { value: 'schedule_update', label: 'Schedule update' },
  { value: 'payment_alert', label: 'Payment alert' },
  { value: 'announcement', label: 'Announcement' },
];

export default function BroadcastForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement' as NotificationType,
    audience: 'all' as 'all' | 'pending',
  });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const result = await apiCall('/api/notifications', 'POST', form);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }
    setSuccess('Notification queued for delivery to member devices.');
    setForm({ title: '', message: '', type: form.type, audience: form.audience });
    router.refresh();
  }

  return (
    <form onSubmit={send} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as NotificationType })}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Audience</label>
          <select
            className={inputClass}
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value as 'all' | 'pending' })}
          >
            <option value="all">All active members</option>
            <option value="pending">Members awaiting approval</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
        <input
          required
          className={inputClass}
          placeholder="Contribution Reminder"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
        <textarea
          required
          rows={4}
          className={inputClass}
          placeholder="Your ₱500.00 contribution for Paluwagan Batch 2026-A is due on October 15, 2026."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <Button type="submit" disabled={busy}>
        <Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send to mobile users'}
      </Button>
    </form>
  );
}
