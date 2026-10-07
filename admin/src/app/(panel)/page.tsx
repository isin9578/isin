import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  HandCoins,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { getDashboardStats, listCycles } from '@/lib/data';
import { formatDate, formatDateTime, formatPeso } from '@/lib/format';
import { PageHeader, Panel, StatCard, StatusBadge } from '@/components/ui';

const ACTIVITY_STYLE: Record<string, { dot: string; label: string }> = {
  contribution: { dot: 'bg-emerald-500', label: 'Contribution' },
  distribution: { dot: 'bg-sky-500', label: 'Distribution' },
  claim: { dot: 'bg-amber-500', label: 'Insurance' },
  member: { dot: 'bg-brand-500', label: 'Member' },
};

export default async function DashboardPage() {
  const [stats, cycles] = await Promise.all([getDashboardStats(), listCycles()]);

  const featuredCycles = cycles
    .filter((c) => c.status !== 'draft')
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Paluwagan pools, contributions and protection at a glance."
      />

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Members"
          value={String(stats.total_members)}
          hint={`${stats.pending_members} awaiting approval`}
          icon={<Users className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Active Cycles"
          value={String(stats.active_cycles)}
          hint="Paluwagan batches running"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Contributions"
          value={String(stats.pending_contributions)}
          hint="receipts awaiting verification"
          icon={<HandCoins className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Total Verified Savings"
          value={formatPeso(stats.total_verified_savings)}
          hint="sum of verified contributions"
          icon={<Wallet className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Open Insurance Claims"
          value={String(stats.pending_claims)}
          hint="submitted or under review"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Scheduled Payouts"
          value={String(stats.scheduled_payouts)}
          hint="awaiting disbursement"
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <StatCard
          label="Total Disbursed"
          value={formatPeso(stats.disbursed_total)}
          hint="pooled funds already released"
          icon={<Wallet className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Admin Action Items"
          value={String(
            stats.pending_contributions + stats.pending_members + stats.pending_claims,
          )}
          hint="approvals + verifications + claims"
          icon={<HandCoins className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Panel
          title="Recent activity"
          className="lg:col-span-2"
          actions={
            <Link href="/contributions" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800">
              Review contributions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <ul className="divide-y divide-slate-100">
            {stats.activity.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-slate-400">
                No activity yet.
              </li>
            )}
            {stats.activity.map((item) => {
              const style = ACTIVITY_STYLE[item.kind] ?? ACTIVITY_STYLE.member;
              return (
                <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 px-4 py-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{item.title}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {item.detail} · {formatDateTime(item.occurred_at)}
                    </div>
                  </div>
                  {item.amount != null && (
                    <div className="text-sm font-semibold text-slate-900">
                      {formatPeso(item.amount)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Cycle pools */}
        <Panel title="Cycle pools">
          <ul className="divide-y divide-slate-100">
            {featuredCycles.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-slate-400">
                No cycles yet.
              </li>
            )}
            {featuredCycles.map((cycle) => {
              const pooled =
                cycle.total_verified_contributions + cycle.total_pending_contributions;
              const pct = cycle.expected_pool_amount
                ? Math.min(100, Math.round((pooled / cycle.expected_pool_amount) * 100))
                : 0;
              return (
                <li key={cycle.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {cycle.title}
                    </span>
                    <StatusBadge status={cycle.status} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {cycle.member_count} members · {formatPeso(cycle.contribution_amount)}{' '}
                    {cycle.frequency} · {formatDate(cycle.start_date)} –{' '}
                    {formatDate(cycle.end_date)}
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                    <span>Pooled {formatPeso(pooled)}</span>
                    <span>
                      Expected {formatPeso(cycle.expected_pool_amount)} ({pct}%)
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
