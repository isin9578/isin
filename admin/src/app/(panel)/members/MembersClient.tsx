'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, UserPlus, UserCheck, CalendarPlus } from 'lucide-react';
import Modal from '@/components/Modal';
import { Button, EmptyRow, StatusBadge, TD, TH, Table } from '@/components/ui';
import { apiCall } from '@/lib/client';
import { formatDate, formatMobile, formatPeso } from '@/lib/format';
import type { CycleRow, MemberRow } from '@/lib/types';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100';

export default function MembersClient({
  members,
  cycles,
  query,
}: {
  members: MemberRow[];
  cycles: CycleRow[];
  query: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<MemberRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // register form state
  const [reg, setReg] = useState({
    full_name: '',
    mobile_number: '',
    birthdate: '',
    address: '',
    password: '',
  });

  // assign form state
  const [assign, setAssign] = useState({ cycle_id: '', slot_number: 1, payout_date: '' });

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(search ? { q: search } : {});
    router.replace(`/members?${params.toString()}`);
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await apiCall('/api/members', 'POST', reg);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }
    setRegisterOpen(false);
    setReg({ full_name: '', mobile_number: '', birthdate: '', address: '', password: '' });
    router.refresh();
  }

  async function assignSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!assignFor) return;
    setBusy(true);
    setError(null);
    const result = await apiCall('/api/cycles/assign', 'POST', {
      cycle_id: assign.cycle_id,
      user_id: assignFor.id,
      slot_number: Number(assign.slot_number),
      payout_date: assign.payout_date,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }
    setAssignFor(null);
    router.refresh();
  }

  async function approve(member: MemberRow) {
    setError(null);
    const result = await apiCall(`/api/members/${member.id}`, 'PATCH', { status: 'active' });
    if (!result.ok) setError(result.error ?? null);
    router.refresh();
  }

  const assignableCycles = cycles.filter((c) => c.status !== 'completed');

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={applySearch} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or mobile…"
            className="w-64 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </form>
        <Button onClick={() => setRegisterOpen(true)}>
          <UserPlus className="h-4 w-4" /> Register member
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
              <TH>Member</TH>
              <TH>Status</TH>
              <TH>Total savings</TH>
              <TH>Contributions</TH>
              <TH>Cycles</TH>
              <TH>Coverage</TH>
              <TH>Joined</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 && <EmptyRow colSpan={8} label="No members found." />}
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/60">
                <TD>
                  <div className="font-medium text-slate-900">{m.full_name}</div>
                  <div className="text-xs text-slate-500">{formatMobile(m.mobile_number)}</div>
                </TD>
                <TD><StatusBadge status={m.status} /></TD>
                <TD className="font-semibold text-slate-900">{formatPeso(m.total_savings)}</TD>
                <TD>{m.contribution_count}</TD>
                <TD>{m.cycle_count}</TD>
                <TD>{formatPeso(m.active_coverage)}</TD>
                <TD className="text-xs text-slate-500">{formatDate(m.created_at)}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    {m.status === 'pending' && (
                      <Button onClick={() => approve(m)} className="!py-1.5 !text-xs">
                        <UserCheck className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="!py-1.5 !text-xs"
                      onClick={() => {
                        setError(null);
                        setAssign({
                          cycle_id: assignableCycles[0]?.id ?? '',
                          slot_number: 1,
                          payout_date: '',
                        });
                        setAssignFor(m);
                      }}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" /> Assign to cycle
                    </Button>
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Register modal */}
      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register member account"
      >
        <form onSubmit={register} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Full name</label>
            <input
              required
              className={inputClass}
              value={reg.full_name}
              onChange={(e) => setReg({ ...reg, full_name: e.target.value })}
              placeholder="Juan Dela Cruz"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mobile number</label>
              <input
                required
                className={inputClass}
                value={reg.mobile_number}
                onChange={(e) => setReg({ ...reg, mobile_number: e.target.value })}
                placeholder="09171234567"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Birthdate</label>
              <input
                type="date"
                className={inputClass}
                value={reg.birthdate}
                onChange={(e) => setReg({ ...reg, birthdate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
            <input
              className={inputClass}
              value={reg.address}
              onChange={(e) => setReg({ ...reg, address: e.target.value })}
              placeholder="123 Rizal St, Quezon City"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Temporary password (optional)
            </label>
            <input
              className={inputClass}
              value={reg.password}
              onChange={(e) => setReg({ ...reg, password: e.target.value })}
              placeholder="Defaults to ChangeMe123!"
            />
          </div>
          <p className="text-xs text-slate-500">
            The member signs in with their mobile number. Accounts registered here are
            activated immediately; self-registered accounts land in <em>pending</em> until
            approved.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign-to-cycle modal */}
      <Modal
        open={assignFor !== null}
        onClose={() => setAssignFor(null)}
        title={assignFor ? `Assign ${assignFor.full_name} to a cycle` : 'Assign'}
      >
        <form onSubmit={assignSlot} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Paluwagan cycle</label>
            <select
              required
              className={inputClass}
              value={assign.cycle_id}
              onChange={(e) => setAssign({ ...assign, cycle_id: e.target.value })}
            >
              <option value="" disabled>
                Select a cycle…
              </option>
              {assignableCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.frequency} · ₱{c.contribution_amount})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Slot number</label>
              <input
                type="number"
                min={1}
                required
                className={inputClass}
                value={assign.slot_number}
                onChange={(e) =>
                  setAssign({ ...assign, slot_number: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Payout date</label>
              <input
                type="date"
                required
                className={inputClass}
                value={assign.payout_date}
                onChange={(e) => setAssign({ ...assign, payout_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setAssignFor(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !assign.cycle_id}>
              {busy ? 'Assigning…' : 'Assign slot'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
