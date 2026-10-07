-- iSIN demo/development seed data
-- Run with: supabase db reset   (or paste into the SQL editor on a fresh project)
--
-- Demo accounts created below (the mobile app maps mobile number ->
-- `${digits}@members.isin.local`, so member auth emails follow that rule):
--   Admin   admin@isin.ph  / Admin123!  (role = admin, login with email)
--   Member  09171234567@members.isin.local  / Member123!  (mobile 09171234567)
--   Member  09181234568@members.isin.local  / Member123!  (mobile 09181234568)
--   Member  09191234569@members.isin.local  / Member123!  (mobile 09191234569)
--   Member  09201234570@members.isin.local  / Member123!  (mobile 09201234570)
--   Member  09211234571@members.isin.local  / Member123!  (mobile 09211234571)
--
-- Profiles are created automatically by the on_auth_user_created trigger.

begin;

-- ---------------------------------------------------------------------------
-- auth users (password auth)
-- ---------------------------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'admin@isin.ph',
   extensions.crypt('Admin123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"System Admin","mobile_number":"09170000000","role":"admin"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', '09171234567@members.isin.local',
   extensions.crypt('Member123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Juan Dela Cruz","mobile_number":"09171234567","birthdate":"1990-04-12","address":"123 Rizal St, Quezon City"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', '09181234568@members.isin.local',
   extensions.crypt('Member123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Maria Santos","mobile_number":"09181234568","birthdate":"1985-09-23","address":"45 Bonifacio Ave, Pasig City"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000003',
   'authenticated', 'authenticated', '09191234569@members.isin.local',
   extensions.crypt('Member123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Jose Ramos","mobile_number":"09191234569","birthdate":"1993-02-08","address":"78 Mabini St, Marikina City"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000004',
   'authenticated', 'authenticated', '09201234570@members.isin.local',
   extensions.crypt('Member123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Ana Reyes","mobile_number":"09201234570","birthdate":"1998-11-30","address":"32 Sampaguita St, Caloocan City"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000005',
   'authenticated', 'authenticated', '09211234571@members.isin.local',
   extensions.crypt('Member123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Lito Garcia","mobile_number":"09211234571","birthdate":"1987-06-17","address":"9 Narra St, Antipolo City"}',
   now(), now())
on conflict (id) do nothing;

insert into auth.identities
  (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email in ('admin@isin.ph', '09171234567@members.isin.local', '09181234568@members.isin.local',
                  '09191234569@members.isin.local', '09201234570@members.isin.local', '09211234571@members.isin.local')
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

-- ---------------------------------------------------------------------------
-- cycles
-- ---------------------------------------------------------------------------
insert into public.cycles (id, title, contribution_amount, frequency, start_date, end_date, status)
values
  ('30000000-0000-4000-8000-000000000001', 'Paluwagan Batch 2025-A', 500.00, 'monthly',
   date '2025-01-15', date '2025-04-15', 'completed'),
  ('30000000-0000-4000-8000-000000000002', 'Paluwagan Batch 2026-A', 500.00, 'monthly',
   date '2026-09-15', date '2027-04-15', 'active'),
  ('30000000-0000-4000-8000-000000000003', 'Paluwagan Batch 2026-B', 500.00, 'bi-weekly',
   date '2026-11-01', date '2027-03-15', 'draft')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- cycle slot assignments (payout order)
-- ---------------------------------------------------------------------------
insert into public.cycle_members (cycle_id, user_id, slot_number, payout_date, status)
select * from (values
  -- completed 2025-A cycle
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 1, date '2025-04-15', 'completed'),
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 2, date '2025-05-15', 'completed'),
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 3, date '2025-06-15', 'completed'),
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, 4, date '2025-07-15', 'completed'),
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000005'::uuid, 5, date '2025-08-15', 'completed'),
  -- active 2026-A cycle
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 1, date '2026-12-15', 'active'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 2, date '2027-01-15', 'active'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 3, date '2027-02-15', 'active'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, 4, date '2027-03-15', 'active'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000005'::uuid, 5, date '2027-04-15', 'active')
) as t(cycle_id, user_id, slot_number, payout_date, status)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- contributions: verified history for 2025-A (monthly Jan..Apr 2025)
-- ---------------------------------------------------------------------------
insert into public.contributions (user_id, cycle_id, amount, payment_date, payment_method, status)
select
  m.uid,
  '30000000-0000-4000-8000-000000000001'::uuid,
  500.00,
  (d::timestamp + time '10:00'),
  (array['GCash', 'Maya', 'Manual Admin Entry'])[1 + (m.ord % 3)],
  'verified'
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, 0),
  ('20000000-0000-4000-8000-000000000002'::uuid, 1),
  ('20000000-0000-4000-8000-000000000003'::uuid, 2),
  ('20000000-0000-4000-8000-000000000004'::uuid, 3),
  ('20000000-0000-4000-8000-000000000005'::uuid, 4)
) as m(uid, ord)
cross join generate_series(date '2025-01-15', date '2025-04-15', interval '1 month') as d
on conflict do nothing;

-- contributions for active 2026-A cycle: September verified, October pending
insert into public.contributions (user_id, cycle_id, amount, payment_date, payment_method, status, proof_of_payment_url)
select
  m.uid,
  '30000000-0000-4000-8000-000000000002'::uuid,
  500.00,
  date '2026-09-15'::timestamp + time '09:00',
  (array['GCash', 'Maya'])[1 + (m.ord % 2)],
  'verified',
  null
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, 0),
  ('20000000-0000-4000-8000-000000000002'::uuid, 1),
  ('20000000-0000-4000-8000-000000000003'::uuid, 2),
  ('20000000-0000-4000-8000-000000000004'::uuid, 3),
  ('20000000-0000-4000-8000-000000000005'::uuid, 4)
) as m(uid, ord)
on conflict do nothing;

insert into public.contributions (user_id, cycle_id, amount, payment_date, payment_method, status, proof_of_payment_url)
select
  m.uid,
  '30000000-0000-4000-8000-000000000002'::uuid,
  500.00,
  date '2026-10-01'::timestamp + time '18:30',
  'GCash',
  'pending',
  'https://placeholder.supabase.co/storage/v1/object/public/payment-proofs/' || m.ord::text || '-oct-receipt.jpg'
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, 0),
  ('20000000-0000-4000-8000-000000000002'::uuid, 1),
  ('20000000-0000-4000-8000-000000000003'::uuid, 2),
  ('20000000-0000-4000-8000-000000000004'::uuid, 3),
  ('20000000-0000-4000-8000-000000000005'::uuid, 4)
) as m(uid, ord)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- distributions
-- ---------------------------------------------------------------------------
-- 2025-A: every slot completed and disbursed (5 members x 4 periods x 500 / 5 slots = 2,000 each)
insert into public.distributions (cycle_id, recipient_user_id, amount, disbursement_date, status, reference_number)
select
  '30000000-0000-4000-8000-000000000001'::uuid,
  cm.user_id,
  2000.00,
  cm.payout_date::timestamp + time '14:00',
  'disbursed',
  'ISIN-2025A-' || lpad(cm.slot_number::text, 4, '0')
from public.cycle_members cm
where cm.cycle_id = '30000000-0000-4000-8000-000000000001'
on conflict (cycle_id, recipient_user_id) do nothing;

-- 2026-A: upcoming payouts scheduled (expected pool 5 x 500 x 7 = 17,500)
insert into public.distributions (cycle_id, recipient_user_id, amount, disbursement_date, status, reference_number)
select
  '30000000-0000-4000-8000-000000000002'::uuid,
  cm.user_id,
  17500.00,
  null,
  'scheduled',
  null
from public.cycle_members cm
where cm.cycle_id = '30000000-0000-4000-8000-000000000002'
on conflict (cycle_id, recipient_user_id) do nothing;

-- ---------------------------------------------------------------------------
-- micro-insurance coverage
-- ---------------------------------------------------------------------------
insert into public.insurance_policies (user_id, coverage_type, coverage_amount, premium_amount, status, start_date, end_date)
select u.uid, t.coverage_type, t.coverage_amount, t.premium_amount, 'active', date '2026-01-01', date '2026-12-31'
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid),
  ('20000000-0000-4000-8000-000000000002'::uuid),
  ('20000000-0000-4000-8000-000000000003'::uuid),
  ('20000000-0000-4000-8000-000000000004'::uuid),
  ('20000000-0000-4000-8000-000000000005'::uuid)
) as u(uid)
cross join (values
  ('Life Insurance'::text, 100000.00, 150.00),
  ('Accident Coverage', 50000.00, 75.00)
) as t(coverage_type, coverage_amount, premium_amount)
on conflict (user_id, coverage_type) do nothing;

insert into public.insurance_policies (user_id, coverage_type, coverage_amount, premium_amount, status, start_date, end_date)
values
  ('20000000-0000-4000-8000-000000000002', 'Health Protection', 30000.00, 120.00, 'active', date '2026-01-01', date '2026-12-31'),
  ('20000000-0000-4000-8000-000000000004', 'Health Protection', 30000.00, 120.00, 'active', date '2026-01-01', date '2026-12-31'),
  ('20000000-0000-4000-8000-000000000003', 'Other', 20000.00, 60.00, 'lapsed', date '2026-01-01', date '2026-06-30')
on conflict (user_id, coverage_type) do nothing;

-- ---------------------------------------------------------------------------
-- claims
-- ---------------------------------------------------------------------------
insert into public.insurance_claims (user_id, claim_type, description, status, documents_url, submitted_at)
values
  ('20000000-0000-4000-8000-000000000002', 'Accident Coverage',
   'Motorcycle accident on Sep 12, 2026. Hospital confinement for 3 days, requesting accident benefit.',
   'submitted', array['https://placeholder.supabase.co/storage/v1/object/public/claim-docs/maria-hospital-bill.pdf'],
   now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000003', 'Health Protection',
   'Outpatient surgery in August 2026, requesting health protection benefit reimbursement.',
   'under_review', array['https://placeholder.supabase.co/storage/v1/object/public/claim-docs/jose-medical-cert.pdf',
                          'https://placeholder.supabase.co/storage/v1/object/public/claim-docs/jose-receipts.pdf'],
   now() - interval '9 days'),
  ('20000000-0000-4000-8000-000000000001', 'Other',
   'Typhoon damage to roof, requesting assistance under other specified risks coverage.',
   'approved', array['https://placeholder.supabase.co/storage/v1/object/public/claim-docs/juan-photos.pdf'],
   now() - interval '30 days');

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
insert into public.notifications (user_id, title, message, type, is_read, created_at)
select
  m.uid,
  'Contribution Reminder',
  'Your ₱500.00 contribution for Paluwagan Batch 2026-A is due on October 15, 2026.',
  'contribution_reminder',
  false,
  now() - interval '6 hours'
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid),
  ('20000000-0000-4000-8000-000000000002'::uuid),
  ('20000000-0000-4000-8000-000000000003'::uuid),
  ('20000000-0000-4000-8000-000000000004'::uuid),
  ('20000000-0000-4000-8000-000000000005'::uuid)
) as m(uid)
on conflict do nothing;

insert into public.notifications (user_id, title, message, type, is_read, created_at)
values
  ('20000000-0000-4000-8000-000000000001', 'Distribution Scheduled',
   'Your scheduled payout of ₱17,500.00 is set for December 15, 2026.', 'schedule_update', false, now() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000001', 'Contribution Verified',
   'Your contribution of ₱500.00 for Paluwagan Batch 2026-A has been verified.', 'payment_alert', true, now() - interval '20 days'),
  ('20000000-0000-4000-8000-000000000002', 'Claim Received',
   'Your Accident Coverage claim has been submitted and is awaiting review.', 'announcement', false, now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000003', 'Announcement',
   'Payout schedule for Paluwagan Batch 2026-A is now final. Check your Distributions screen.', 'announcement', false, now() - interval '3 days');

-- ---------------------------------------------------------------------------
-- notification preferences (one member opts out of announcements)
-- ---------------------------------------------------------------------------
insert into public.notification_preferences (user_id, type, enabled)
values
  ('20000000-0000-4000-8000-000000000005', 'announcement', false),
  ('20000000-0000-4000-8000-000000000005', 'contribution_reminder', true),
  ('20000000-0000-4000-8000-000000000005', 'schedule_update', true),
  ('20000000-0000-4000-8000-000000000005', 'payment_alert', true)
on conflict (user_id, type) do nothing;

commit;
