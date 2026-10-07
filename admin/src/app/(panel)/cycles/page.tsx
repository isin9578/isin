import { listCycles, listSlots } from '@/lib/data';
import { formatMobile } from '@/lib/format';
import { EmptyRow, PageHeader, Panel, StatusBadge, TD, TH, Table } from '@/components/ui';
import CyclesClient from './CyclesClient';

export default async function CyclesPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { cycle } = await searchParams;
  const cycles = await listCycles();

  const selected =
    cycles.find((c) => c.id === cycle) ??
    cycles.find((c) => c.status === 'active') ??
    cycles[0];

  const slots = selected ? await listSlots(selected.id) : [];

  return (
    <div>
      <PageHeader
        title="Cycles & Slot Assignments"
        subtitle="Paluwagan batches — pooled contribution schedules and payout order. Assign members from the Members page."
      />

      <CyclesClient cycles={cycles} selectedId={selected?.id ?? ''} />

      {selected && (
        <Panel
          className="mt-6"
          title={`Payout schedule — ${selected.title}`}
          actions={
            <span className="text-xs text-slate-500">
              {slots.length} slot{slots.length === 1 ? '' : 's'} assigned
            </span>
          }
        >
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <TH>Slot</TH>
                <TH>Member</TH>
                <TH>Mobile</TH>
                <TH>Payout date</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.length === 0 && (
                <EmptyRow
                  colSpan={5}
                  label="No members assigned yet — use “Assign to cycle” on the Members page."
                />
              )}
              {slots.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <TD>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                      {s.slot_number}
                    </span>
                  </TD>
                  <TD className="font-medium text-slate-900">{s.member_name}</TD>
                  <TD>{formatMobile(s.mobile_number)}</TD>
                  <TD>{new Date(s.payout_date).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</TD>
                  <TD><StatusBadge status={s.status} /></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}
