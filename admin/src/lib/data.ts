// Data facade for the admin panel.
// Every function has two paths: live Supabase (service-role, server-side only)
// and an in-memory demo store used when no Supabase project is configured.

import { randomUUID } from 'node:crypto';
import { isDemoMode } from './env';
import { DEMO_ADMIN_ID, getDemoDb } from './demo/store';
import { createAdminClient } from './supabase/admin';
import type {
  ActivityItem,
  ClaimRow,
  ContributionRow,
  CycleRow,
  DashboardStats,
  DistributionRow,
  MemberRow,
  NotificationRow,
  PolicyRow,
  SlotRow,
} from './types';
import type {
  ClaimStatus,
  ContributionStatus,
  CoverageType,
  CycleFrequency,
  CycleStatus,
  DistributionStatus,
  NotificationType,
  PolicyStatus,
  ProfileStatus,
} from './database.types';

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface MemberInput {
  full_name: string;
  mobile_number: string;
  birthdate?: string;
  address?: string;
  password?: string;
}

export interface CycleInput {
  title: string;
  contribution_amount: number;
  frequency: CycleFrequency;
  start_date: string;
  end_date: string;
  status: CycleStatus;
}

export interface AssignSlotInput {
  cycle_id: string;
  user_id: string;
  slot_number: number;
  payout_date: string;
}

export interface PolicyInput {
  user_id: string;
  coverage_type: CoverageType;
  coverage_amount: number;
  premium_amount: number;
  status: PolicyStatus;
  start_date?: string;
  end_date?: string;
}

export interface BroadcastInput {
  title: string;
  message: string;
  type: NotificationType;
  audience: 'all' | 'pending';
}

function fail(message: string): never {
  throw new Error(message);
}

function pick<T extends object>(
  row: T,
  key: string,
): Record<string, unknown> | null {
  const value = (row as Record<string, unknown>)[key];
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function demoActivity(): ActivityItem[] {
  const db = getDemoDb();
  const nameOf = (id: string) =>
    db.profiles.find((p) => p.id === id)?.full_name ?? 'Member';

  const items: ActivityItem[] = [];

  for (const c of [...db.contributions]
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date))
    .slice(0, 5)) {
    items.push({
      id: c.id,
      kind: 'contribution',
      title: c.status === 'verified' ? 'Contribution Received' : 'Contribution Submitted',
      detail: nameOf(c.user_id),
      amount: c.amount,
      status: c.status,
      occurred_at: c.payment_date,
    });
  }
  for (const cl of [...db.insurance_claims]
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
    .slice(0, 3)) {
    items.push({
      id: cl.id,
      kind: 'claim',
      title: `Claim ${cl.status.replace('_', ' ')}`,
      detail: `${nameOf(cl.user_id)} · ${cl.claim_type}`,
      amount: null,
      status: cl.status,
      occurred_at: cl.updated_at ?? cl.submitted_at,
    });
  }
  for (const d of [...db.distributions]
    .filter((x) => x.status === 'disbursed')
    .sort((a, b) => (b.disbursement_date ?? '').localeCompare(a.disbursement_date ?? ''))
    .slice(0, 2)) {
    items.push({
      id: d.id,
      kind: 'distribution',
      title: 'Payout Disbursed',
      detail: nameOf(d.recipient_user_id),
      amount: d.amount,
      status: d.status,
      occurred_at: d.disbursement_date ?? '',
    });
  }
  for (const p of db.profiles.filter((x) => x.status === 'pending')) {
    items.push({
      id: p.id,
      kind: 'member',
      title: 'Member Awaiting Approval',
      detail: p.full_name,
      amount: null,
      status: 'pending',
      occurred_at: p.created_at,
    });
  }

  return items.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)).slice(0, 8);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isDemoMode()) {
    const db = getDemoDb();
    const members = db.profiles.filter((p) => p.role === 'member');
    const verified = db.contributions.filter((c) => c.status === 'verified');
    return {
      total_members: members.length,
      pending_members: members.filter((m) => m.status === 'pending').length,
      active_cycles: db.cycles.filter((c) => c.status === 'active').length,
      pending_contributions: db.contributions.filter((c) => c.status === 'pending').length,
      total_verified_savings: verified.reduce((sum, c) => sum + c.amount, 0),
      pending_claims: db.insurance_claims.filter((c) =>
        ['submitted', 'under_review'].includes(c.status),
      ).length,
      scheduled_payouts: db.distributions.filter((d) => d.status === 'scheduled').length,
      disbursed_total: db.distributions
        .filter((d) => d.status === 'disbursed')
        .reduce((sum, d) => sum + d.amount, 0),
      activity: demoActivity(),
    };
  }

  const db = createAdminClient();

  const [
    profilesRes,
    savingsRes,
    cyclesRes,
    pendingContribRes,
    openClaimsRes,
    scheduledRes,
    disbursedRes,
    recentContribRes,
    recentClaimsRes,
    recentMembersRes,
  ] = await Promise.all([
    db.from('profiles').select('id, role, status'),
    db.from('member_savings').select('total_verified_savings'),
    db.from('cycle_pool_totals').select('status'),
    db.from('contributions').select('id').eq('status', 'pending'),
    db.from('insurance_claims')
      .select('id')
      .in('status', ['submitted', 'under_review']),
    db.from('distributions').select('id, amount').eq('status', 'scheduled'),
    db.from('distributions').select('amount').eq('status', 'disbursed'),
    db.from('contributions')
      .select('id, user_id, amount, status, payment_date, profiles(full_name)')
      .order('payment_date', { ascending: false })
      .limit(5),
    db.from('insurance_claims')
      .select('id, user_id, claim_type, status, submitted_at, updated_at, profiles(full_name)')
      .order('submitted_at', { ascending: false })
      .limit(3),
    db.from('profiles')
      .select('id, full_name, created_at, status')
      .eq('role', 'member')
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const [
    profiles,
    savings,
    cycles,
    pendingContrib,
    openClaims,
    scheduled,
    disbursed,
    recentContrib,
    recentClaims,
    recentMembers,
  ] = [
    profilesRes.data ?? [],
    savingsRes.data ?? [],
    cyclesRes.data ?? [],
    pendingContribRes.data ?? [],
    openClaimsRes.data ?? [],
    scheduledRes.data ?? [],
    disbursedRes.data ?? [],
    recentContribRes.data ?? [],
    recentClaimsRes.data ?? [],
    recentMembersRes.data ?? [],
  ] as Record<string, unknown>[][];

  const activity: ActivityItem[] = [
    ...recentContrib.map((c) => ({
      id: String(c.id),
      kind: 'contribution' as const,
      title: c.status === 'verified' ? 'Contribution Received' : 'Contribution Submitted',
      detail: String(pick(c, 'profiles')?.full_name ?? 'Member'),
      amount: Number(c.amount),
      status: String(c.status),
      occurred_at: String(c.payment_date),
    })),
    ...recentClaims.map((c) => ({
      id: String(c.id),
      kind: 'claim' as const,
      title: `Claim ${String(c.status).replace('_', ' ')}`,
      detail: `${String(pick(c, 'profiles')?.full_name ?? 'Member')} · ${String(c.claim_type)}`,
      amount: null,
      status: String(c.status),
      occurred_at: String(c.updated_at ?? c.submitted_at),
    })),
    ...recentMembers.map((m) => ({
      id: String(m.id),
      kind: 'member' as const,
      title: m.status === 'pending' ? 'Member Awaiting Approval' : 'Member Registered',
      detail: String(m.full_name),
      amount: null,
      status: String(m.status),
      occurred_at: String(m.created_at),
    })),
  ].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  return {
    total_members: profiles.filter((p) => p.role === 'member').length,
    pending_members: profiles.filter((p) => p.status === 'pending').length,
    active_cycles: cycles.filter((c) => c.status === 'active').length,
    pending_contributions: pendingContrib.length,
    total_verified_savings: savings.reduce(
      (sum, s) => sum + Number(s.total_verified_savings ?? 0),
      0,
    ),
    pending_claims: openClaims.length,
    scheduled_payouts: scheduled.length,
    disbursed_total: disbursed.reduce((sum, d) => sum + Number(d.amount ?? 0), 0),
    activity: activity.slice(0, 8),
  };
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

function demoMembers(search?: string): MemberRow[] {
  const db = getDemoDb();
  const term = search?.trim().toLowerCase();
  return db.profiles
    .filter((p) => p.role === 'member')
    .filter(
      (p) =>
        !term ||
        p.full_name.toLowerCase().includes(term) ||
        p.mobile_number.includes(term),
    )
    .map((p) => {
      const contributions = db.contributions.filter((c) => c.user_id === p.id);
      return {
        ...p,
        total_savings: contributions
          .filter((c) => c.status === 'verified')
          .reduce((sum, c) => sum + c.amount, 0),
        contribution_count: contributions.length,
        cycle_count: db.cycle_members.filter((cm) => cm.user_id === p.id).length,
        active_coverage: db.insurance_policies
          .filter((pl) => pl.user_id === p.id && pl.status === 'active')
          .reduce((sum, pl) => sum + pl.coverage_amount, 0),
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listMembers(search?: string): Promise<MemberRow[]> {
  if (isDemoMode()) return demoMembers(search);

  const db = createAdminClient();
  const [profilesRes, savingsRes, slotsRes, policiesRes] = await Promise.all([
    db
      .from('profiles')
      .select('*')
      .eq('role', 'member')
      .order('created_at', { ascending: false }),
    db.from('member_savings').select('*'),
    db.from('cycle_members').select('user_id'),
    db.from('insurance_policies').select('user_id, status, coverage_amount'),
  ]);
  if (profilesRes.error) fail(profilesRes.error.message);

  const savings = new Map(
    (savingsRes.data ?? []).map((s) => [s.user_id, s]),
  );
  const cycles = new Map<string, number>();
  for (const s of slotsRes.data ?? []) {
    cycles.set(s.user_id, (cycles.get(s.user_id) ?? 0) + 1);
  }
  const coverage = new Map<string, number>();
  for (const p of policiesRes.data ?? []) {
    if (p.status === 'active') {
      coverage.set(
        p.user_id,
        (coverage.get(p.user_id) ?? 0) + Number(p.coverage_amount ?? 0),
      );
    }
  }

  const term = search?.trim().toLowerCase();
  return (profilesRes.data ?? [])
    .filter(
      (p) =>
        !term ||
        p.full_name.toLowerCase().includes(term) ||
        p.mobile_number.includes(term),
    )
    .map((p) => {
      const s = savings.get(p.id);
      return {
        ...p,
        total_savings: Number(s?.total_verified_savings ?? 0),
        contribution_count: Number(s?.contribution_count ?? 0),
        cycle_count: cycles.get(p.id) ?? 0,
        active_coverage: coverage.get(p.id) ?? 0,
      };
    });
}

export async function registerMember(input: MemberInput): Promise<MemberRow> {
  const mobile = input.mobile_number.replace(/\s|-/g, '');
  if (!input.full_name.trim()) fail('Full name is required.');
  if (!/^0\d{10}$/.test(mobile)) fail('Mobile number must look like 09XXXXXXXXX.');

  if (isDemoMode()) {
    const db = getDemoDb();
    if (db.profiles.some((p) => p.mobile_number === mobile)) {
      fail('That mobile number is already registered.');
    }
    const profile = {
      id: randomUUID(),
      full_name: input.full_name.trim(),
      mobile_number: mobile,
      birthdate: input.birthdate || null,
      address: input.address || null,
      role: 'member' as const,
      status: 'active' as ProfileStatus,
      created_at: new Date().toISOString(),
    };
    db.profiles.push(profile);
    return {
      ...profile,
      total_savings: 0,
      contribution_count: 0,
      cycle_count: 0,
      active_coverage: 0,
    };
  }

  const admin = createAdminClient();
  const email = `${mobile}@members.isin.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password ?? 'ChangeMe123!',
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name.trim(),
      mobile_number: mobile,
      birthdate: input.birthdate ?? '',
      address: input.address ?? '',
      self_signup: 'false',
    },
  });
  if (error) fail(error.message);
  if (!data.user) fail('Could not create member account.');

  const created = await listMembers();
  const row = created.find((m) => m.id === data.user!.id);
  if (!row) fail('Member created but profile not found.');
  return row;
}

export async function updateMemberStatus(
  id: string,
  status: ProfileStatus,
): Promise<void> {
  if (isDemoMode()) {
    const db = getDemoDb();
    const profile = db.profiles.find((p) => p.id === id);
    if (!profile) fail('Member not found.');
    profile.status = status;
    return;
  }
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ status }).eq('id', id);
  if (error) fail(error.message);
}

// ---------------------------------------------------------------------------
// Cycles & slots
// ---------------------------------------------------------------------------

function demoCycles(): CycleRow[] {
  const db = getDemoDb();
  return db.cycles.map((c) => {
    const slots = db.cycle_members.filter((cm) => cm.cycle_id === c.id);
    const contribs = db.contributions.filter((ct) => ct.cycle_id === c.id);
    const verified = contribs.filter((ct) => ct.status === 'verified');
    const pending = contribs.filter((ct) => ct.status === 'pending');
    return {
      id: c.id,
      title: c.title,
      contribution_amount: c.contribution_amount,
      frequency: c.frequency,
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status,
      member_count: slots.length,
      active_member_count: slots.filter((s) => s.status === 'active').length,
      completed_slot_count: slots.filter((s) => s.status === 'completed').length,
      total_verified_contributions: verified.reduce((sum, v) => sum + v.amount, 0),
      total_pending_contributions: pending.reduce((sum, v) => sum + v.amount, 0),
      expected_pool_amount: slots.length * c.contribution_amount * countPeriods(c),
      pending_contribution_count: pending.length,
    };
  });
}

/** Number of contribution periods in a cycle (monthly or bi-weekly). */
function countPeriods(cycle: { frequency: CycleFrequency; start_date: string; end_date: string }): number {
  const start = new Date(cycle.start_date);
  const end = new Date(cycle.end_date);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (cycle.frequency === 'monthly') return Math.max(1, months + 1);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  return Math.max(1, Math.floor(days / 14) + 1);
}

export async function listCycles(): Promise<CycleRow[]> {
  if (isDemoMode()) return demoCycles();

  const db = createAdminClient();
  const { data, error } = await db
    .from('cycle_pool_totals')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) fail(error.message);
  return (data ?? []).map((c) => ({
    id: c.cycle_id,
    title: c.title,
    contribution_amount: Number(c.contribution_amount),
    frequency: c.frequency,
    start_date: c.start_date,
    end_date: c.end_date,
    status: c.status,
    member_count: Number(c.member_count),
    active_member_count: Number(c.active_member_count),
    completed_slot_count: Number(c.completed_slot_count),
    total_verified_contributions: Number(c.total_verified_contributions),
    total_pending_contributions: Number(c.total_pending_contributions),
    expected_pool_amount: Number(c.expected_pool_amount),
    pending_contribution_count: Number(c.pending_contribution_count),
  }));
}

export async function createCycle(input: CycleInput): Promise<void> {
  if (!input.title.trim()) fail('Title is required.');
  if (new Date(input.end_date) < new Date(input.start_date)) {
    fail('End date must be on or after start date.');
  }

  if (isDemoMode()) {
    const db = getDemoDb();
    if (db.cycles.some((c) => c.title.toLowerCase() === input.title.trim().toLowerCase())) {
      fail('A cycle with that title already exists.');
    }
    db.cycles.push({
      id: randomUUID(),
      title: input.title.trim(),
      contribution_amount: input.contribution_amount,
      frequency: input.frequency,
      start_date: input.start_date,
      end_date: input.end_date,
      status: input.status,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin.from('cycles').insert({
    title: input.title.trim(),
    contribution_amount: input.contribution_amount,
    frequency: input.frequency,
    start_date: input.start_date,
    end_date: input.end_date,
    status: input.status,
  });
  if (error) fail(error.message);
}

function demoSlots(cycleId: string): SlotRow[] {
  const db = getDemoDb();
  const cycle = db.cycles.find((c) => c.id === cycleId);
  return db.cycle_members
    .filter((cm) => cm.cycle_id === cycleId)
    .sort((a, b) => a.slot_number - b.slot_number)
    .map((cm) => {
      const profile = db.profiles.find((p) => p.id === cm.user_id);
      return {
        id: cm.id,
        cycle_id: cm.cycle_id,
        cycle_title: cycle?.title ?? '—',
        user_id: cm.user_id,
        member_name: profile?.full_name ?? '—',
        mobile_number: profile?.mobile_number ?? '—',
        slot_number: cm.slot_number,
        payout_date: cm.payout_date,
        status: cm.status,
      };
    });
}

export async function listSlots(cycleId: string): Promise<SlotRow[]> {
  if (isDemoMode()) return demoSlots(cycleId);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('cycle_members')
    .select('*, cycles(title), profiles(full_name, mobile_number)')
    .eq('cycle_id', cycleId)
    .order('slot_number', { ascending: true });
  if (error) fail(error.message);

  return (data ?? []).map((row) => {
    const profile = pick(row, 'profiles');
    const cycle = pick(row, 'cycles');
    return {
      id: row.id,
      cycle_id: row.cycle_id,
      cycle_title: String(cycle?.title ?? '—'),
      user_id: row.user_id,
      member_name: String(profile?.full_name ?? '—'),
      mobile_number: String(profile?.mobile_number ?? '—'),
      slot_number: row.slot_number,
      payout_date: row.payout_date,
      status: row.status,
    };
  });
}

export async function assignMemberToCycle(input: AssignSlotInput): Promise<void> {
  if (!Number.isInteger(input.slot_number) || input.slot_number < 1) {
    fail('Slot number must be a positive whole number.');
  }
  if (!input.payout_date) fail('Payout date is required.');

  if (isDemoMode()) {
    const db = getDemoDb();
    if (!db.cycles.some((c) => c.id === input.cycle_id)) fail('Cycle not found.');
    if (!db.profiles.some((p) => p.id === input.user_id)) fail('Member not found.');
    if (
      db.cycle_members.some(
        (cm) => cm.cycle_id === input.cycle_id && cm.slot_number === input.slot_number,
      )
    ) {
      fail(`Slot ${input.slot_number} is already taken in this cycle.`);
    }
    if (
      db.cycle_members.some(
        (cm) => cm.cycle_id === input.cycle_id && cm.user_id === input.user_id,
      )
    ) {
      fail('That member is already assigned to this cycle.');
    }
    db.cycle_members.push({
      id: randomUUID(),
      cycle_id: input.cycle_id,
      user_id: input.user_id,
      slot_number: input.slot_number,
      payout_date: input.payout_date,
      status: 'active',
    });
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin.from('cycle_members').insert({
    cycle_id: input.cycle_id,
    user_id: input.user_id,
    slot_number: input.slot_number,
    payout_date: input.payout_date,
    status: 'active',
  });
  if (error) fail(error.message);
}

// ---------------------------------------------------------------------------
// Contributions
// ---------------------------------------------------------------------------

function demoContributions(status?: ContributionStatus): ContributionRow[] {
  const db = getDemoDb();
  return db.contributions
    .filter((c) => !status || c.status === status)
    .map((c) => {
      const profile = db.profiles.find((p) => p.id === c.user_id);
      const cycle = db.cycles.find((cy) => cy.id === c.cycle_id);
      return {
        id: c.id,
        user_id: c.user_id,
        member_name: profile?.full_name ?? '—',
        mobile_number: profile?.mobile_number ?? '—',
        cycle_id: c.cycle_id,
        cycle_title: cycle?.title ?? '—',
        amount: c.amount,
        payment_date: c.payment_date,
        payment_method: c.payment_method,
        status: c.status,
        proof_of_payment_url: c.proof_of_payment_url,
        notes: c.notes,
        created_at: c.created_at,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listContributions(
  status?: ContributionStatus,
): Promise<ContributionRow[]> {
  if (isDemoMode()) return demoContributions(status);

  const admin = createAdminClient();
  let query = admin
    .from('contributions')
    .select('*, profiles(full_name, mobile_number), cycles(title)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) fail(error.message);

  return (data ?? []).map((row) => {
    const profile = pick(row, 'profiles');
    const cycle = pick(row, 'cycles');
    return {
      id: row.id,
      user_id: row.user_id,
      member_name: String(profile?.full_name ?? '—'),
      mobile_number: String(profile?.mobile_number ?? '—'),
      cycle_id: row.cycle_id,
      cycle_title: String(cycle?.title ?? '—'),
      amount: Number(row.amount),
      payment_date: row.payment_date,
      payment_method: row.payment_method,
      status: row.status,
      proof_of_payment_url: row.proof_of_payment_url,
      notes: row.notes,
      created_at: row.created_at,
    };
  });
}

export async function updateContributionStatus(
  id: string,
  status: Extract<ContributionStatus, 'verified' | 'failed'>,
  notes?: string,
): Promise<void> {
  if (isDemoMode()) {
    const db = getDemoDb();
    const contribution = db.contributions.find((c) => c.id === id);
    if (!contribution) fail('Contribution not found.');
    contribution.status = status;
    contribution.notes = notes ?? contribution.notes;

    // Mirror the on_contribution_status_change trigger.
    const cycle = db.cycles.find((c) => c.id === contribution.cycle_id);
    db.notifications.unshift({
      id: randomUUID(),
      user_id: contribution.user_id,
      title: status === 'verified' ? 'Contribution Verified' : 'Contribution Needs Attention',
      message:
        status === 'verified'
          ? `Your contribution of ₱${contribution.amount.toFixed(2)} for ${cycle?.title ?? 'your cycle'} has been verified.`
          : `Your contribution of ₱${contribution.amount.toFixed(2)} for ${cycle?.title ?? 'your cycle'} could not be verified. Please contact support.`,
      type: 'payment_alert',
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('contributions')
    .update(status === 'failed' ? { status, notes: notes ?? null } : { status })
    .eq('id', id);
  if (error) fail(error.message);
}

// ---------------------------------------------------------------------------
// Distributions
// ---------------------------------------------------------------------------

function demoDistributions(): DistributionRow[] {
  const db = getDemoDb();
  return db.distributions
    .map((d) => {
      const cycle = db.cycles.find((c) => c.id === d.cycle_id);
      const profile = db.profiles.find((p) => p.id === d.recipient_user_id);
      const slot = db.cycle_members.find(
        (cm) => cm.cycle_id === d.cycle_id && cm.user_id === d.recipient_user_id,
      );
      return {
        id: d.id,
        cycle_id: d.cycle_id,
        cycle_title: cycle?.title ?? '—',
        recipient_user_id: d.recipient_user_id,
        recipient_name: profile?.full_name ?? '—',
        slot_number: slot?.slot_number ?? null,
        amount: d.amount,
        disbursement_date: d.disbursement_date,
        payout_date: slot?.payout_date ?? null,
        status: d.status,
        reference_number: d.reference_number,
      };
    })
    .sort((a, b) =>
      (a.payout_date ?? '').localeCompare(b.payout_date ?? ''),
    );
}

export async function listDistributions(): Promise<DistributionRow[]> {
  if (isDemoMode()) return demoDistributions();

  const admin = createAdminClient();
  const [distRes, slotsRes] = await Promise.all([
    admin
      .from('distributions')
      .select('*, cycles(title), profiles!distributions_recipient_user_id_fkey(full_name)')
      .order('created_at', { ascending: true }),
    admin.from('cycle_members').select('cycle_id, user_id, slot_number, payout_date'),
  ]);
  if (distRes.error) fail(distRes.error.message);

  const slotMap = new Map(
    (slotsRes.data ?? []).map((s) => [
      `${s.cycle_id}:${s.user_id}`,
      s,
    ]),
  );

  return (distRes.data ?? []).map((row) => {
    const profile = pick(row, 'profiles');
    const cycle = pick(row, 'cycles');
    const slot = slotMap.get(`${row.cycle_id}:${row.recipient_user_id}`);
    return {
      id: row.id,
      cycle_id: row.cycle_id,
      cycle_title: String(cycle?.title ?? '—'),
      recipient_user_id: row.recipient_user_id,
      recipient_name: String(profile?.full_name ?? '—'),
      slot_number: slot?.slot_number ?? null,
      amount: Number(row.amount),
      disbursement_date: row.disbursement_date,
      payout_date: slot?.payout_date ?? null,
      status: row.status,
      reference_number: row.reference_number,
    };
  });
}

export async function disburseDistribution(
  id: string,
  referenceNumber?: string,
): Promise<void> {
  if (isDemoMode()) {
    const db = getDemoDb();
    const dist = db.distributions.find((d) => d.id === id);
    if (!dist) fail('Distribution not found.');
    if (dist.status === 'disbursed') fail('Already disbursed.');

    dist.status = 'disbursed';
    dist.disbursement_date = new Date().toISOString();
    dist.reference_number = referenceNumber ?? dist.reference_number;

    const slot = db.cycle_members.find(
      (cm) => cm.cycle_id === dist.cycle_id && cm.user_id === dist.recipient_user_id,
    );
    if (slot) slot.status = 'completed';

    db.notifications.unshift({
      id: randomUUID(),
      user_id: dist.recipient_user_id,
      title: 'Fund Distribution Disbursed',
      message: `Your pooled payout of ₱${dist.amount.toFixed(2)} has been disbursed.${
        dist.reference_number ? ` Reference: ${dist.reference_number}` : ''
      }`,
      type: 'payment_alert',
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('distributions')
    .update({
      status: 'disbursed' as DistributionStatus,
      reference_number: referenceNumber ?? null,
      disbursement_date: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) fail(error.message);
}

// ---------------------------------------------------------------------------
// Insurance
// ---------------------------------------------------------------------------

function demoPolicies(): PolicyRow[] {
  const db = getDemoDb();
  return db.insurance_policies.map((p) => {
    const profile = db.profiles.find((x) => x.id === p.user_id);
    return {
      id: p.id,
      user_id: p.user_id,
      member_name: profile?.full_name ?? '—',
      mobile_number: profile?.mobile_number ?? '—',
      coverage_type: p.coverage_type,
      coverage_amount: p.coverage_amount,
      premium_amount: p.premium_amount,
      status: p.status,
      start_date: p.start_date,
      end_date: p.end_date,
    };
  });
}

export async function listPolicies(): Promise<PolicyRow[]> {
  if (isDemoMode()) return demoPolicies();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('insurance_policies')
    .select('*, profiles(full_name, mobile_number)')
    .order('created_at', { ascending: false });
  if (error) fail(error.message);

  return (data ?? []).map((row) => {
    const profile = pick(row, 'profiles');
    return {
      id: row.id,
      user_id: row.user_id,
      member_name: String(profile?.full_name ?? '—'),
      mobile_number: String(profile?.mobile_number ?? '—'),
      coverage_type: row.coverage_type,
      coverage_amount: Number(row.coverage_amount),
      premium_amount: Number(row.premium_amount),
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
    };
  });
}

export async function upsertPolicy(input: PolicyInput): Promise<void> {
  if (isDemoMode()) {
    const db = getDemoDb();
    const existing = db.insurance_policies.find(
      (p) => p.user_id === input.user_id && p.coverage_type === input.coverage_type,
    );
    if (existing) {
      existing.coverage_amount = input.coverage_amount;
      existing.premium_amount = input.premium_amount;
      existing.status = input.status;
      existing.end_date = input.end_date ?? existing.end_date;
      return;
    }
    db.insurance_policies.push({
      id: randomUUID(),
      user_id: input.user_id,
      coverage_type: input.coverage_type,
      coverage_amount: input.coverage_amount,
      premium_amount: input.premium_amount,
      status: input.status,
      start_date: input.start_date ?? new Date().toISOString().slice(0, 10),
      end_date: input.end_date ?? null,
    });
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin.from('insurance_policies').upsert(
    {
      user_id: input.user_id,
      coverage_type: input.coverage_type,
      coverage_amount: input.coverage_amount,
      premium_amount: input.premium_amount,
      status: input.status,
      start_date: input.start_date ?? new Date().toISOString().slice(0, 10),
      end_date: input.end_date ?? null,
    },
    { onConflict: 'user_id,coverage_type' },
  );
  if (error) fail(error.message);
}

function demoClaims(): ClaimRow[] {
  const db = getDemoDb();
  return db.insurance_claims
    .map((c) => {
      const profile = db.profiles.find((p) => p.id === c.user_id);
      return {
        id: c.id,
        user_id: c.user_id,
        member_name: profile?.full_name ?? '—',
        mobile_number: profile?.mobile_number ?? '—',
        claim_type: c.claim_type,
        description: c.description,
        status: c.status,
        documents_url: c.documents_url,
        submitted_at: c.submitted_at,
        updated_at: c.updated_at,
      };
    })
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

export async function listClaims(): Promise<ClaimRow[]> {
  if (isDemoMode()) return demoClaims();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('insurance_claims')
    .select('*, profiles(full_name, mobile_number)')
    .order('submitted_at', { ascending: false });
  if (error) fail(error.message);

  return (data ?? []).map((row) => {
    const profile = pick(row, 'profiles');
    return {
      id: row.id,
      user_id: row.user_id,
      member_name: String(profile?.full_name ?? '—'),
      mobile_number: String(profile?.mobile_number ?? '—'),
      claim_type: row.claim_type,
      description: row.description,
      status: row.status,
      documents_url: row.documents_url ?? [],
      submitted_at: row.submitted_at,
      updated_at: row.updated_at,
    };
  });
}

export async function updateClaimStatus(
  id: string,
  status: ClaimStatus,
): Promise<void> {
  if (isDemoMode()) {
    const db = getDemoDb();
    const claim = db.insurance_claims.find((c) => c.id === id);
    if (!claim) fail('Claim not found.');
    claim.status = status;
    claim.updated_at = new Date().toISOString();
    db.notifications.unshift({
      id: randomUUID(),
      user_id: claim.user_id,
      title: 'Claim Update',
      message: `Your ${claim.claim_type} claim is now "${status.replace('_', ' ')}".`,
      type: 'announcement',
      is_read: false,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('insurance_claims')
    .update({ status })
    .eq('id', id)
    .select('user_id, claim_type')
    .single();
  if (error) fail(error.message);

  const { error: notifyError } = await admin.from('notifications').insert({
    user_id: data.user_id,
    title: 'Claim Update',
    message: `Your ${data.claim_type} claim is now "${status.replace('_', ' ')}".`,
    type: 'announcement',
  });
  if (notifyError) fail(notifyError.message);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

function demoNotifications(limit = 50): NotificationRow[] {
  const db = getDemoDb();
  return db.notifications
    .slice(0, limit)
    .map((n) => ({
      ...n,
      member_name: db.profiles.find((p) => p.id === n.user_id)?.full_name ?? '—',
    }));
}

export async function listNotifications(limit = 50): Promise<NotificationRow[]> {
  if (isDemoMode()) return demoNotifications(limit);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('notifications')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) fail(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    member_name: String(pick(row, 'profiles')?.full_name ?? '—'),
    title: row.title,
    message: row.message,
    type: row.type,
    is_read: row.is_read,
    created_at: row.created_at,
  }));
}

export async function sendBroadcast(input: BroadcastInput): Promise<number> {
  if (!input.title.trim() || !input.message.trim()) {
    fail('Title and message are required.');
  }

  if (isDemoMode()) {
    const db = getDemoDb();
    const recipients = db.profiles.filter(
      (p) =>
        p.role === 'member' &&
        (input.audience === 'all' ? p.status === 'active' : p.status === 'pending'),
    );
    const now = new Date().toISOString();
    for (const r of recipients) {
      db.notifications.unshift({
        id: randomUUID(),
        user_id: r.id,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type,
        is_read: false,
        created_at: now,
      });
    }
    return recipients.length;
  }

  const admin = createAdminClient();
  const { data: recipients, error } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'member')
    .eq('status', input.audience === 'all' ? 'active' : 'pending');
  if (error) fail(error.message);

  if (!recipients?.length) return 0;

  const { error: insertError } = await admin.from('notifications').insert(
    recipients.map((r) => ({
      user_id: r.id,
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type,
    })),
  );
  if (insertError) fail(insertError.message);
  return recipients.length;
}

// ---------------------------------------------------------------------------
// Auth (used by /api/auth routes)
// ---------------------------------------------------------------------------

export { DEMO_ADMIN_ID };
export type { ActivityItem };
