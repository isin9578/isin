import { ShieldCheck, FileWarning, Users } from 'lucide-react';
import { listClaims, listMembers, listPolicies } from '@/lib/data';
import { formatDate, formatDateTime, formatMobile, formatPeso } from '@/lib/format';
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
import ClaimActions from './ClaimActions';
import CoverageModal from './CoverageModal';

export default async function InsurancePage() {
  const [policies, claims, members] = await Promise.all([
    listPolicies(),
    listClaims(),
    listMembers(),
  ]);

  const activePolicies = policies.filter((p) => p.status === 'active');
  const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverage_amount, 0);
  const openClaims = claims.filter((c) => c.status === 'submitted' || c.status === 'under_review');

  return (
    <div>
      <PageHeader
        title="Insurance & Claims Management"
        subtitle="Track member coverage statuses and review claim requests submitted from the mobile app."
        actions={<CoverageModal members={members} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Active policies"
          value={String(activePolicies.length)}
          hint="across all members"
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Total active coverage"
          value={formatPeso(totalCoverage)}
          hint="sum of active coverage amounts"
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Open claims"
          value={String(openClaims.length)}
          hint="submitted or under review"
          icon={<FileWarning className="h-5 w-5" />}
        />
        <StatCard
          label="Members covered"
          value={String(new Set(activePolicies.map((p) => p.user_id)).size)}
          hint={`of ${members.length} members`}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <Panel title="Claims requests" className="mb-6">
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <TH>Member</TH>
              <TH>Claim type</TH>
              <TH>Description</TH>
              <TH>Documents</TH>
              <TH>Submitted</TH>
              <TH>Status</TH>
              <TH className="text-right">Action</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claims.length === 0 && <EmptyRow colSpan={7} label="No claims submitted yet." />}
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <TD>
                  <div className="font-medium text-slate-900">{c.member_name}</div>
                  <div className="text-xs text-slate-500">{formatMobile(c.mobile_number)}</div>
                </TD>
                <TD className="text-xs font-medium text-slate-700">{c.claim_type}</TD>
                <TD className="max-w-xs">
                  <p className="line-clamp-2 text-xs text-slate-600">{c.description}</p>
                </TD>
                <TD>
                  <div className="flex flex-col gap-1">
                    {c.documents_url.length === 0 && (
                      <span className="text-xs text-slate-400">none</span>
                    )}
                    {c.documents_url.slice(0, 2).map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        Open document
                      </a>
                    ))}
                    {c.documents_url.length > 2 && (
                      <span className="text-[11px] text-slate-400">
                        +{c.documents_url.length - 2} more
                      </span>
                    )}
                  </div>
                </TD>
                <TD className="text-xs text-slate-600">{formatDateTime(c.submitted_at)}</TD>
                <TD><StatusBadge status={c.status} /></TD>
                <TD><ClaimActions id={c.id} status={c.status} /></TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel title="Member coverage">
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <TH>Member</TH>
              <TH>Coverage type</TH>
              <TH>Coverage amount</TH>
              <TH>Premium</TH>
              <TH>Policy period</TH>
              <TH>Status</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {policies.length === 0 && (
              <EmptyRow colSpan={6} label="No coverage tracked yet." />
            )}
            {policies.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <TD>
                  <div className="font-medium text-slate-900">{p.member_name}</div>
                  <div className="text-xs text-slate-500">{formatMobile(p.mobile_number)}</div>
                </TD>
                <TD className="text-xs font-medium text-slate-700">{p.coverage_type}</TD>
                <TD className="font-semibold text-slate-900">
                  {formatPeso(p.coverage_amount)}
                </TD>
                <TD className="text-xs">{formatPeso(p.premium_amount)}</TD>
                <TD className="text-xs text-slate-600">
                  {formatDate(p.start_date)} – {formatDate(p.end_date)}
                </TD>
                <TD><StatusBadge status={p.status} /></TD>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
