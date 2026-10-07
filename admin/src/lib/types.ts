// App-level view models consumed by the admin UI.
// Both the Supabase data layer and the demo store produce these shapes.

import type {
  ClaimStatus,
  ContributionStatus,
  CoverageType,
  CycleFrequency,
  CycleMemberStatus,
  CycleStatus,
  DistributionStatus,
  NotificationType,
  PaymentMethod,
  PolicyStatus,
  ProfileStatus,
  Role,
} from './database.types';

export interface MemberRow {
  id: string;
  full_name: string;
  mobile_number: string;
  birthdate: string | null;
  address: string | null;
  role: Role;
  status: ProfileStatus;
  created_at: string;
  total_savings: number;
  contribution_count: number;
  cycle_count: number;
  active_coverage: number;
}

export interface CycleRow {
  id: string;
  title: string;
  contribution_amount: number;
  frequency: CycleFrequency;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  member_count: number;
  active_member_count: number;
  completed_slot_count: number;
  total_verified_contributions: number;
  total_pending_contributions: number;
  expected_pool_amount: number;
  pending_contribution_count: number;
}

export interface SlotRow {
  id: string;
  cycle_id: string;
  cycle_title: string;
  user_id: string;
  member_name: string;
  mobile_number: string;
  slot_number: number;
  payout_date: string;
  status: CycleMemberStatus;
}

export interface ContributionRow {
  id: string;
  user_id: string;
  member_name: string;
  mobile_number: string;
  cycle_id: string;
  cycle_title: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  status: ContributionStatus;
  proof_of_payment_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface DistributionRow {
  id: string;
  cycle_id: string;
  cycle_title: string;
  recipient_user_id: string;
  recipient_name: string;
  slot_number: number | null;
  amount: number;
  disbursement_date: string | null;
  payout_date: string | null;
  status: DistributionStatus;
  reference_number: string | null;
}

export interface PolicyRow {
  id: string;
  user_id: string;
  member_name: string;
  mobile_number: string;
  coverage_type: CoverageType;
  coverage_amount: number;
  premium_amount: number;
  status: PolicyStatus;
  start_date: string;
  end_date: string | null;
}

export interface ClaimRow {
  id: string;
  user_id: string;
  member_name: string;
  mobile_number: string;
  claim_type: CoverageType;
  description: string;
  status: ClaimStatus;
  documents_url: string[];
  submitted_at: string;
  updated_at: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  member_name: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  kind: 'contribution' | 'distribution' | 'claim' | 'member';
  title: string;
  detail: string;
  amount: number | null;
  status: string;
  occurred_at: string;
}

export interface DashboardStats {
  total_members: number;
  pending_members: number;
  active_cycles: number;
  pending_contributions: number;
  total_verified_savings: number;
  pending_claims: number;
  scheduled_payouts: number;
  disbursed_total: number;
  activity: ActivityItem[];
}
