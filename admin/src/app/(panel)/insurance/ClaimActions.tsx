'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileCheck2, Eye, XCircle } from 'lucide-react';
import { apiCall } from '@/lib/client';
import type { ClaimStatus } from '@/lib/database.types';

const NEXT_ACTIONS: { to: ClaimStatus; label: string; className: string }[] = [
  {
    to: 'under_review',
    label: 'Review',
    className: 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
  },
  {
    to: 'approved',
    label: 'Approve',
    className: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  {
    to: 'rejected',
    label: 'Reject',
    className: 'border border-red-200 text-red-600 hover:bg-red-50',
  },
];

export default function ClaimActions({ id, status }: { id: string; status: ClaimStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function transition(to: ClaimStatus) {
    setBusy(true);
    const result = await apiCall(`/api/claims/${id}`, 'PATCH', { status: to });
    setBusy(false);
    if (!result.ok) {
      window.alert(result.error ?? 'Failed to update claim.');
      return;
    }
    router.refresh();
  }

  const actions = NEXT_ACTIONS.filter((a) => a.to !== status);

  if (actions.length === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className="flex justify-end gap-1.5">
      {actions.map((action) => (
        <button
          key={action.to}
          disabled={busy}
          onClick={() => transition(action.to)}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${action.className}`}
        >
          {action.to === 'approved' && <FileCheck2 className="h-3.5 w-3.5" />}
          {action.to === 'under_review' && <Eye className="h-3.5 w-3.5" />}
          {action.to === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
          {action.label}
        </button>
      ))}
    </div>
  );
}
