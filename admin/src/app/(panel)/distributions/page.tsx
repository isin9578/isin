import { listCycles, listDistributions } from '@/lib/data';
import { formatDateTime, formatDate, formatPeso } from '@/lib/format';
import {
  EmptyRow,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  TD,
  TH,
  Table,
} from '@/components/ui';
import { Banknote, CalendarClock, Wallet } from 'lucide-react';
import DisburseButton from './DisburseButton';

export default async function DistributionsPage() {
  const [distributions, cycles] = await Promise.all([
    listDistributions(),
    listCycles(),
  ]);

  const scheduled = distributions.filter((d) => d.status === 'scheduled');
  const disbursed = distributions.filter((d) => d.status === 'disbursed');
  const totalDisbursed = disbursed.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div>
      <PageHeader
        title="Scheduled Fund Distribution"
        subtitle="Monitor monthly pool totals and log payouts to assigned members on their payout date."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Scheduled payouts"
          value={String(scheduled.length)}
          hint="awaiting release"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <StatCard
          label="Disbursed payouts"
          value={String(disbursed.length)}
          hint="completed distributions"
          icon={<Banknote className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Total released"
          value={formatPeso(totalDisbursed)}
          hint="pooled funds disbursed"
          icon={<Wallet className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Active cycle pools"
          value={formatPeso(
            cycles
              .filter((c) => c.status === 'active')
              .reduce((sum, c) => sum + c.total_verified_contributions, 0),
          )}
          hint="verified contributions in active cycles"
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      <Panel title="Payout schedule">
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <TH>Cycle</TH>
              <TH>Slot</TH>
              <TH>Recipient</TH>
              <TH>Pooled amount</TH>
              <TH>Payout date</TH>
              <TH>Status</TH>
              <TH>Disbursed / reference</TH>
              <TH className="text-right">Action</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {distributions.length === 0 && (
              <EmptyRow
                colSpan={8}
                label="No distributions scheduled — assign members to a cycle first."
              />
            )}
            {distributions.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/60">
                <TD className="text-xs text-slate-600">{d.cycle_title}</TD>
                <TD>
                  {d.slot_number != null ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700">
                      {d.slot_number}
                    </span>
                  ) : (
                    '—'
                  )}
                </TD>
                <TD>
                  <div className="font-medium text-slate-900">{d.recipient_name}</div>
                </TD>
                <TD className="font-semibold text-slate-900">{formatPeso(d.amount)}</TD>
                <TD className="text-xs text-slate-600">
                  {d.status === 'disbursed' && d.disbursement_date
                    ? formatDate(d.disbursement_date)
                    : formatDate(d.payout_date)}
                </TD>
                <TD><StatusBadge status={d.status} /></TD>
                <TD className="text-xs text-slate-600">
                  {d.status === 'disbursed' ? (
                    <>
                      <div>{formatDateTime(d.disbursement_date)}</div>
                      {d.reference_number && (
                        <div className="font-mono text-[11px] text-slate-400">
                          {d.reference_number}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TD>
                <TD>
                  <div className="flex justify-end">
                    {d.status === 'scheduled' || d.status === 'pending_verification' ? (
                      <DisburseButton
                        id={d.id}
                        recipientName={d.recipient_name}
                        amount={d.amount}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">completed</span>
                    )}
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <p className="mt-3 text-xs text-slate-500">
        Member mobile numbers are hidden here by design — payout confirmations are delivered
        in-app. Find contact details under Members.
      </p>
    </div>
  );
}
