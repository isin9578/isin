'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui';
import { apiCall } from '@/lib/client';
import type { CoverageType, PolicyStatus } from '@/lib/database.types';
import type { MemberRow } from '@/lib/types';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100';

const COVERAGE_TYPES: CoverageType[] = [
  'Life Insurance',
  'Accident Coverage',
  'Health Protection',
  'Other',
];

export default function CoverageModal({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    user_id: '',
    coverage_type: 'Life Insurance' as CoverageType,
    coverage_amount: 100000,
    premium_amount: 150,
    status: 'active' as PolicyStatus,
    end_date: '',
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await apiCall('/api/policies', 'POST', {
      ...form,
      coverage_amount: Number(form.coverage_amount),
      premium_amount: Number(form.premium_amount),
      end_date: form.end_date || null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Track coverage
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Track member coverage">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Member</label>
            <select
              required
              className={inputClass}
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            >
              <option value="" disabled>
                Select member…
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} — {m.mobile_number}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Coverage type</label>
              <select
                className={inputClass}
                value={form.coverage_type}
                onChange={(e) =>
                  setForm({ ...form, coverage_type: e.target.value as CoverageType })
                }
              >
                {COVERAGE_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PolicyStatus })}
              >
                <option value="active">active</option>
                <option value="lapsed">lapsed</option>
                <option value="expired">expired</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Coverage ₱</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.coverage_amount}
                onChange={(e) =>
                  setForm({ ...form, coverage_amount: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Premium ₱</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.premium_amount}
                onChange={(e) =>
                  setForm({ ...form, premium_amount: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">End date</label>
              <input
                type="date"
                className={inputClass}
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !form.user_id}>
              {busy ? 'Saving…' : 'Save coverage'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
