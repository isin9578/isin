// In-memory fixtures mirroring supabase/seed.sql — used when no Supabase
// project is configured (DEMO MODE) so the panel is fully clickable.

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
} from '../database.types';

export interface DemoProfile {
  id: string;
  full_name: string;
  mobile_number: string;
  birthdate: string | null;
  address: string | null;
  role: Role;
  status: ProfileStatus;
  created_at: string;
}

export interface DemoCycle {
  id: string;
  title: string;
  contribution_amount: number;
  frequency: CycleFrequency;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  created_at: string;
}

export interface DemoCycleMember {
  id: string;
  cycle_id: string;
  user_id: string;
  slot_number: number;
  payout_date: string;
  status: CycleMemberStatus;
}

export interface DemoContribution {
  id: string;
  user_id: string;
  cycle_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  status: ContributionStatus;
  proof_of_payment_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface DemoDistribution {
  id: string;
  cycle_id: string;
  recipient_user_id: string;
  amount: number;
  disbursement_date: string | null;
  status: DistributionStatus;
  reference_number: string | null;
}

export interface DemoPolicy {
  id: string;
  user_id: string;
  coverage_type: CoverageType;
  coverage_amount: number;
  premium_amount: number;
  status: PolicyStatus;
  start_date: string;
  end_date: string | null;
}

export interface DemoClaim {
  id: string;
  user_id: string;
  claim_type: CoverageType;
  description: string;
  status: ClaimStatus;
  documents_url: string[];
  submitted_at: string;
  updated_at: string | null;
}

export interface DemoNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface DemoDb {
  profiles: DemoProfile[];
  cycles: DemoCycle[];
  cycle_members: DemoCycleMember[];
  contributions: DemoContribution[];
  distributions: DemoDistribution[];
  insurance_policies: DemoPolicy[];
  insurance_claims: DemoClaim[];
  notifications: DemoNotification[];
}

const ADMIN_ID = '10000000-0000-4000-8000-000000000001';
export const DEMO_ADMIN_ID = ADMIN_ID;
const M1 = '20000000-0000-4000-8000-000000000001';
const M2 = '20000000-0000-4000-8000-000000000002';
const M3 = '20000000-0000-4000-8000-000000000003';
const M4 = '20000000-0000-4000-8000-000000000004';
const M5 = '20000000-0000-4000-8000-000000000005';
const M6 = '20000000-0000-4000-8000-000000000006';

const CYCLE_2025 = '30000000-0000-4000-8000-000000000001';
const CYCLE_2026A = '30000000-0000-4000-8000-000000000002';
const CYCLE_2026B = '30000000-0000-4000-8000-000000000003';

export const DEMO_MEMBER_IDS = [M1, M2, M3, M4, M5, M6];

export function createDemoDb(): DemoDb {
  const profiles: DemoProfile[] = [
    {
      id: ADMIN_ID,
      full_name: 'System Admin',
      mobile_number: '09170000000',
      birthdate: '1988-01-05',
      address: 'Admin Office, Quezon City',
      role: 'admin',
      status: 'active',
      created_at: '2025-01-02T08:00:00+08:00',
    },
    {
      id: M1,
      full_name: 'Juan Dela Cruz',
      mobile_number: '09171234567',
      birthdate: '1990-04-12',
      address: '123 Rizal St, Quezon City',
      role: 'member',
      status: 'active',
      created_at: '2025-01-05T09:12:00+08:00',
    },
    {
      id: M2,
      full_name: 'Maria Santos',
      mobile_number: '09181234568',
      birthdate: '1985-09-23',
      address: '45 Bonifacio Ave, Pasig City',
      role: 'member',
      status: 'active',
      created_at: '2025-01-06T10:30:00+08:00',
    },
    {
      id: M3,
      full_name: 'Jose Ramos',
      mobile_number: '09191234569',
      birthdate: '1993-02-08',
      address: '78 Mabini St, Marikina City',
      role: 'member',
      status: 'active',
      created_at: '2025-01-07T14:05:00+08:00',
    },
    {
      id: M4,
      full_name: 'Ana Reyes',
      mobile_number: '09201234570',
      birthdate: '1998-11-30',
      address: '32 Sampaguita St, Caloocan City',
      role: 'member',
      status: 'active',
      created_at: '2025-02-11T11:44:00+08:00',
    },
    {
      id: M5,
      full_name: 'Lito Garcia',
      mobile_number: '09211234571',
      birthdate: '1987-06-17',
      address: '9 Narra St, Antipolo City',
      role: 'member',
      status: 'active',
      created_at: '2025-03-03T16:20:00+08:00',
    },
    {
      id: M6,
      full_name: 'Precious Lim',
      mobile_number: '09221234572',
      birthdate: '2000-07-19',
      address: '17 Narra St, Makati City',
      role: 'member',
      status: 'pending',
      created_at: '2026-10-03T19:02:00+08:00',
    },
  ];

  const cycles: DemoCycle[] = [
    {
      id: CYCLE_2025,
      title: 'Paluwagan Batch 2025-A',
      contribution_amount: 500,
      frequency: 'monthly',
      start_date: '2025-01-15',
      end_date: '2025-04-15',
      status: 'completed',
      created_at: '2025-01-02T08:00:00+08:00',
    },
    {
      id: CYCLE_2026A,
      title: 'Paluwagan Batch 2026-A',
      contribution_amount: 500,
      frequency: 'monthly',
      start_date: '2026-09-15',
      end_date: '2027-04-15',
      status: 'active',
      created_at: '2026-08-20T08:00:00+08:00',
    },
    {
      id: CYCLE_2026B,
      title: 'Paluwagan Batch 2026-B',
      contribution_amount: 500,
      frequency: 'bi-weekly',
      start_date: '2026-11-01',
      end_date: '2027-03-15',
      status: 'draft',
      created_at: '2026-10-01T08:00:00+08:00',
    },
  ];

  const members2025: [string, number, string, CycleMemberStatus][] = [
    [M1, 1, '2025-04-15', 'completed'],
    [M2, 2, '2025-05-15', 'completed'],
    [M3, 3, '2025-06-15', 'completed'],
    [M4, 4, '2025-07-15', 'completed'],
    [M5, 5, '2025-08-15', 'completed'],
  ];
  const members2026: [string, number, string, CycleMemberStatus][] = [
    [M1, 1, '2026-12-15', 'active'],
    [M2, 2, '2027-01-15', 'active'],
    [M3, 3, '2027-02-15', 'active'],
    [M4, 4, '2027-03-15', 'active'],
    [M5, 5, '2027-04-15', 'active'],
  ];

  let seq = 1;
  const uid = (prefix: string) => `${prefix}-${String(seq++).padStart(4, '0')}`;

  const cycle_members: DemoCycleMember[] = [
    ...members2025.map(([user_id, slot_number, payout_date, status]) => ({
      id: uid('cm25'),
      cycle_id: CYCLE_2025,
      user_id,
      slot_number,
      payout_date,
      status,
    })),
    ...members2026.map(([user_id, slot_number, payout_date, status]) => ({
      id: uid('cm26'),
      cycle_id: CYCLE_2026A,
      user_id,
      slot_number,
      payout_date,
      status,
    })),
  ];

  const contributions: DemoContribution[] = [];

  // 2025-A: verified monthly contributions Jan–Apr 2025
  const methods: PaymentMethod[] = ['GCash', 'Maya', 'Manual Admin Entry'];
  [M1, M2, M3, M4, M5].forEach((user_id, mi) => {
    for (let m = 0; m < 4; m++) {
      const date = new Date(Date.UTC(2025, m, 15, 10, 0, 0));
      contributions.push({
        id: uid('ct25'),
        user_id,
        cycle_id: CYCLE_2025,
        amount: 500,
        payment_date: date.toISOString(),
        payment_method: methods[(mi + m) % 3],
        status: 'verified',
        proof_of_payment_url: null,
        notes: null,
        created_at: date.toISOString(),
      });
    }
  });

  // 2026-A: September verified + October pending for every member
  [M1, M2, M3, M4, M5].forEach((user_id, mi) => {
    contributions.push({
      id: uid('ct26v'),
      user_id,
      cycle_id: CYCLE_2026A,
      amount: 500,
      payment_date: '2026-09-15T09:00:00+08:00',
      payment_method: mi % 2 === 0 ? 'GCash' : 'Maya',
      status: 'verified',
      proof_of_payment_url: null,
      notes: null,
      created_at: '2026-09-15T09:05:00+08:00',
    });
    contributions.push({
      id: uid('ct26p'),
      user_id,
      cycle_id: CYCLE_2026A,
      amount: 500,
      payment_date: '2026-10-01T18:30:00+08:00',
      payment_method: 'GCash',
      status: 'pending',
      proof_of_payment_url: `https://placeholder.supabase.co/storage/v1/object/public/payment-proofs/${mi}-oct-receipt.jpg`,
      notes: null,
      created_at: '2026-10-01T18:31:00+08:00',
    });
  });

  const distributions: DemoDistribution[] = [
    ...members2025.map(([user_id, , payout_date]) => ({
      id: uid('ds25'),
      cycle_id: CYCLE_2025,
      recipient_user_id: user_id,
      amount: 2000,
      disbursement_date: `${payout_date}T14:00:00+08:00`,
      status: 'disbursed' as DistributionStatus,
      reference_number: `ISIN-2025A-${String(
        members2025.findIndex((r) => r[0] === user_id) + 1,
      ).padStart(4, '0')}`,
    })),
    ...members2026.map(([user_id]) => ({
      id: uid('ds26'),
      cycle_id: CYCLE_2026A,
      recipient_user_id: user_id,
      amount: 17500,
      disbursement_date: null,
      status: 'scheduled' as DistributionStatus,
      reference_number: null,
    })),
  ];

  const insurance_policies: DemoPolicy[] = [];
  [M1, M2, M3, M4, M5].forEach((user_id, i) => {
    insurance_policies.push({
      id: uid('pl'),
      user_id,
      coverage_type: 'Life Insurance',
      coverage_amount: 100000,
      premium_amount: 150,
      status: 'active',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    });
    insurance_policies.push({
      id: uid('pl'),
      user_id,
      coverage_type: 'Accident Coverage',
      coverage_amount: 50000,
      premium_amount: 75,
      status: 'active',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    });
    if (i === 1 || i === 3) {
      insurance_policies.push({
        id: uid('pl'),
        user_id,
        coverage_type: 'Health Protection',
        coverage_amount: 30000,
        premium_amount: 120,
        status: 'active',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
      });
    }
    if (i === 2) {
      insurance_policies.push({
        id: uid('pl'),
        user_id,
        coverage_type: 'Other',
        coverage_amount: 20000,
        premium_amount: 60,
        status: 'lapsed',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
      });
    }
  });

  const insurance_claims: DemoClaim[] = [
    {
      id: uid('cl'),
      user_id: M2,
      claim_type: 'Accident Coverage',
      description:
        'Motorcycle accident on Sep 12, 2026. Hospital confinement for 3 days, requesting accident benefit.',
      status: 'submitted',
      documents_url: [
        'https://placeholder.supabase.co/storage/v1/object/public/claim-docs/maria-hospital-bill.pdf',
      ],
      submitted_at: '2026-10-03T10:15:00+08:00',
      updated_at: null,
    },
    {
      id: uid('cl'),
      user_id: M3,
      claim_type: 'Health Protection',
      description:
        'Outpatient surgery in August 2026, requesting health protection benefit reimbursement.',
      status: 'under_review',
      documents_url: [
        'https://placeholder.supabase.co/storage/v1/object/public/claim-docs/jose-medical-cert.pdf',
        'https://placeholder.supabase.co/storage/v1/object/public/claim-docs/jose-receipts.pdf',
      ],
      submitted_at: '2026-09-26T13:40:00+08:00',
      updated_at: '2026-09-28T09:00:00+08:00',
    },
    {
      id: uid('cl'),
      user_id: M1,
      claim_type: 'Other',
      description: 'Typhoon damage to roof, requesting assistance under other specified risks coverage.',
      status: 'approved',
      documents_url: [
        'https://placeholder.supabase.co/storage/v1/object/public/claim-docs/juan-photos.pdf',
      ],
      submitted_at: '2026-09-05T08:20:00+08:00',
      updated_at: '2026-09-10T15:30:00+08:00',
    },
  ];

  const notifications: DemoNotification[] = [
    ...[M1, M2, M3, M4, M5].map((user_id) => ({
      id: uid('nt'),
      user_id,
      title: 'Contribution Reminder',
      message:
        'Your ₱500.00 contribution for Paluwagan Batch 2026-A is due on October 15, 2026.',
      type: 'contribution_reminder' as NotificationType,
      is_read: false,
      created_at: '2026-10-05T07:00:00+08:00',
    })),
    {
      id: uid('nt'),
      user_id: M1,
      title: 'Distribution Scheduled',
      message: 'Your scheduled payout of ₱17,500.00 is set for December 15, 2026.',
      type: 'schedule_update',
      is_read: false,
      created_at: '2026-10-04T09:00:00+08:00',
    },
    {
      id: uid('nt'),
      user_id: M1,
      title: 'Contribution Verified',
      message: 'Your contribution of ₱500.00 for Paluwagan Batch 2026-A has been verified.',
      type: 'payment_alert',
      is_read: true,
      created_at: '2026-09-15T09:10:00+08:00',
    },
    {
      id: uid('nt'),
      user_id: M2,
      title: 'Claim Received',
      message: 'Your Accident Coverage claim has been submitted and is awaiting review.',
      type: 'announcement',
      is_read: false,
      created_at: '2026-10-03T10:16:00+08:00',
    },
  ];

  return {
    profiles,
    cycles,
    cycle_members,
    contributions,
    distributions,
    insurance_policies,
    insurance_claims,
    notifications,
  };
}
