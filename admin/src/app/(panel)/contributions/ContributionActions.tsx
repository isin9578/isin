'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { apiCall } from '@/lib/client';

export default function ContributionActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (status !== 'pending') return <span className="text-xs text-slate-400">—</span>;

  async function decide(next: 'verified' | 'failed') {
    let notes: string | undefined;
    if (next === 'failed') {
      const reason = window.prompt('Reason for rejecting this receipt (optional):');
      if (reason === null) return; // cancelled
      notes = reason || undefined;
    }
    setBusy(true);
    const result = await apiCall(`/api/contributions/${id}`, 'PATCH', {
      status: next,
      notes,
    });
    setBusy(false);
    if (!result.ok) {
      window.alert(result.error ?? 'Failed to update contribution.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        disabled={busy}
        onClick={() => decide('verified')}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> Verify
      </button>
      <button
        disabled={busy}
        onClick={() => decide('failed')}
        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" /> Reject
      </button>
    </div>
  );
}
