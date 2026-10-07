import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { listContributions } from '@/lib/data';
import type { ContributionStatus } from '@/lib/database.types';
import { formatDateTime, formatMobile, formatPeso } from '@/lib/format';
import { EmptyRow, PageHeader, Panel, StatusBadge, TD, TH, Table } from '@/components/ui';
import ContributionActions from './ContributionActions';

const TABS = [
  { key: 'pending', label: 'Pending review' },
  { key: 'verified', label: 'Verified' },
  { key: 'failed', label: 'Rejected' },
  { key: 'all', label: 'All' },
] as const;

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = 'pending' } = await searchParams;
  const activeTab = TABS.some((t) => t.key === status) ? status : 'pending';

  const [all, filtered] = await Promise.all([
    listContributions(),
    listContributions(activeTab === 'all' ? undefined : (activeTab as ContributionStatus)),
  ]);

  const counts = {
    pending: all.filter((c) => c.status === 'pending').length,
    verified: all.filter((c) => c.status === 'verified').length,
    failed: all.filter((c) => c.status === 'failed').length,
    all: all.length,
  };

  return (
    <div>
      <PageHeader
        title="Contribution Pool & Verification"
        subtitle="Review member receipts (₱500 per cycle by default). Verified contributions update total savings automatically."
      />

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/contributions?status=${tab.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-700 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {counts[tab.key as keyof typeof counts]}
            </span>
          </Link>
        ))}
      </div>

      <Panel>
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <TH>Member</TH>
              <TH>Cycle</TH>
              <TH>Amount</TH>
              <TH>Method</TH>
              <TH>Payment date</TH>
              <TH>Status</TH>
              <TH>Proof</TH>
              <TH className="text-right">Action</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <EmptyRow
                colSpan={8}
                label={
                  activeTab === 'pending'
                    ? 'No pending receipts — all caught up.'
                    : 'No contributions in this view.'
                }
              />
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <TD>
                  <div className="font-medium text-slate-900">{c.member_name}</div>
                  <div className="text-xs text-slate-500">{formatMobile(c.mobile_number)}</div>
                </TD>
                <TD className="text-xs text-slate-600">{c.cycle_title}</TD>
                <TD className="font-semibold text-slate-900">{formatPeso(c.amount)}</TD>
                <TD className="text-xs">{c.payment_method}</TD>
                <TD className="text-xs text-slate-600">{formatDateTime(c.payment_date)}</TD>
                <TD><StatusBadge status={c.status} /></TD>
                <TD>
                  {c.proof_of_payment_url ? (
                    <a
                      href={c.proof_of_payment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                    >
                      <Receipt className="h-3.5 w-3.5" /> View
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">none</span>
                  )}
                </TD>
                <TD>
                  <ContributionActions id={c.id} status={c.status} />
                </TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
