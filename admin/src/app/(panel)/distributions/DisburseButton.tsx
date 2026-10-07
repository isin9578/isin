'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Banknote } from 'lucide-react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui';
import { apiCall } from '@/lib/client';
import { formatPeso } from '@/lib/format';

export default function DisburseButton({
  id,
  recipientName,
  amount,
}: {
  id: string;
  recipientName: string;
  amount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await apiCall(`/api/distributions/${id}`, 'PATCH', {
      reference_number: reference.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }
    setOpen(false);
    setReference('');
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-800"
      >
        <Banknote className="h-3.5 w-3.5" /> Log payout
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Log scheduled payout">
        <form onSubmit={confirm} className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            <div className="font-medium text-slate-900">{recipientName}</div>
            <div className="text-slate-600">
              Pooled amount: <strong>{formatPeso(amount)}</strong>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Reference number (optional)
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              placeholder="GCash / bank reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500">
            Confirming marks the payout <strong>disbursed</strong>, closes the member&apos;s
            slot, and notifies them in the mobile app.
          </p>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Confirm disbursement'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
