'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import { Button, StatusBadge, TD, TH, Table } from '@/components/ui';
import { apiCall } from '@/lib/client';
import { formatDate, formatPeso } from '@/lib/format';
import type { CycleRow } from '@/lib/types';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100';

export default function CyclesClient({
  cycles,
  selectedId,
}: {
  cycles: CycleRow[];
  selectedId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '',
    contribution_amount: 500,
    frequency: 'monthly' as 'monthly' | 'bi-weekly',
    start_date: '',
    end_date: '',
    status: 'draft' as 'draft' | 'active' | 'completed',
  });

  function select(cycleId: string) {
    router.replace(`/cycles?cycle=${cycleId}`);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await apiCall('/api/cycles', 'POST', {
      ...form,
      contribution_amount: Number(form.contribution_amount),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }
    setOpen(false);
    setForm({
      title: '',
      contribution_amount: 500,
      frequency: 'monthly',
      start_date: '',
      end_date: '',
      status: 'draft',
    });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New cycle
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <TH>Cycle</TH>
              <TH>Status</TH>
              <TH>Contribution</TH>
              <TH>Schedule</TH>
              <TH>Members</TH>
              <TH>Pooled / Expected</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cycles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  No cycles yet — create the first Paluwagan batch.
                </td>
              </tr>
            )}
            {cycles.map((c) => {
              const pooled = c.total_verified_contributions + c.total_pending_contributions;
              const pct = c.expected_pool_amount
                ? Math.min(100, Math.round((pooled / c.expected_pool_amount) * 100))
                : 0;
              const selected = c.id === selectedId;
              return (
                <tr
                  key={c.id}
                  onClick={() => select(c.id)}
                  className={`cursor-pointer hover:bg-slate-50 ${selected ? 'bg-brand-50/60' : ''}`}
                >
                  <TD>
                    <div className="font-medium text-slate-900">{c.title}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {c.frequency}
                      {selected && ' · viewing slots below'}
                    </div>
                  </TD>
                  <TD><StatusBadge status={c.status} /></TD>
                  <TD className="font-medium text-slate-900">
                    {formatPeso(c.contribution_amount)}
                  </TD>
                  <TD className="text-xs text-slate-600">
                    {formatDate(c.start_date)} – {formatDate(c.end_date)}
                  </TD>
                  <TD>
                    {c.active_member_count}/{c.member_count}
                    <span className="text-slate-400"> active</span>
                  </TD>
                  <TD>
                    <div className="text-sm font-medium text-slate-900">
                      {formatPeso(pooled)}{' '}
                      <span className="font-normal text-slate-400">
                        / {formatPeso(c.expected_pool_amount)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                    </div>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Paluwagan cycle">
        <form onSubmit={create} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
            <input
              required
              className={inputClass}
              placeholder="Paluwagan Batch 2027-A"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Contribution amount (₱)
              </label>
              <input
                type="number"
                min={1}
                step="0.01"
                required
                className={inputClass}
                value={form.contribution_amount}
                onChange={(e) =>
                  setForm({ ...form, contribution_amount: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Frequency</label>
              <select
                className={inputClass}
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value as 'monthly' | 'bi-weekly' })
                }
              >
                <option value="monthly">Monthly</option>
                <option value="bi-weekly">Bi-weekly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Start date</label>
              <input
                type="date"
                required
                className={inputClass}
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">End date</label>
              <input
                type="date"
                required
                className={inputClass}
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as 'draft' | 'active' | 'completed' })
              }
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create cycle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
