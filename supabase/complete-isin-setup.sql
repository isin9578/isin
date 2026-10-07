-- ============================================================================
-- iSIN: Complete Database Setup (Schema + Seed Data)
-- ============================================================================
-- This script contains the entire database schema and demo data for the iSIN
-- micro-savings and insurance platform.
--
-- USAGE: Paste this entire file into Supabase SQL Editor and run.
--
-- Demo accounts created:
--   Admin:  admin@isin.ph / Admin123!
--   Member: 09171234567@members.isin.local / Member123!
--   Member: 09181234568@members.isin.local / Member123!
--   Member: 09191234569@members.isin.local / Member123!
--   Member: 09201234570@members.isin.local / Member123!
--   Member: 09211234571@members.isin.local / Member123!
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- SECTION 2: PROFILES TABLE
-- ============================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null,
  mobile_number text not null unique,
  birthdate     date,
  address       text,
  role          text not null default 'member' check (role in ('member', 'admin')),
  status        text not null default 'active' check (status in ('pending', 'active', 'suspended')),
  created_at    timestamptz not null default now()
);

comment on column public.profiles.role is 'member | admin';
comment on column public.profiles.status is 'pending | active | suspended (approval state for member accounts)';

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- ============================================================================
-- SECTION 3: CYCLES & CYCLE MEMBERS
-- ============================================================================
create table if not exists public.cycles (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null unique,
  contribution_amount numeric(12,2) not null default 500.00 check (contribution_amount > 0),
  frequency           text not null default 'monthly' check (frequency in ('monthly', 'bi-weekly')),
  start_date          date not null,
  end_date            date not null,
  status              text not null default 'draft' check (status in ('active', 'completed', 'draft')),
  created_at          timestamptz not null default now(),
  constraint cycles_date_order check (end_date >= start_date)
);

comment on column public.cycles.frequency is 'monthly | bi-weekly';
comment on column public.cycles.status is 'active | completed | draft';

create table if not exists public.cycle_members (
  id          uuid primary key default gen_random_uuid(),
  cycle_id    uuid not null references public.cycles (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  slot_number integer not null check (slot_number > 0),
  payout_date date not null,
  status      text not null default 'active' check (status in ('active', 'completed')),
  created_at  timestamptz not null default now(),
  constraint cycle_members_cycle_slot_unique unique (cycle_id, slot_number),
  constraint cycle_members_cycle_user_unique unique (cycle_id, user_id)
);

comment on column public.cycle_members.slot_number is 'Order/sequence of who receives the distribution pool';
comment on column public.cycle_members.payout_date is 'Scheduled date to receive the pooled funds';

create index if not exists cycle_members_user_idx on public.cycle_members (user_id);
create index if not exists cycle_members_cycle_idx on public.cycle_members (cycle_id);

-- ============================================================================
-- SECTION 4: CONTRIBUTIONS
-- ============================================================================
create table if not exists public.contributions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  cycle_id           uuid not null references public.cycles (id) on delete cascade,
  amount             numeric(12,2) not null default 500.00 check (amount > 0),
  payment_date       timestamptz not null default now(),
  payment_method     text not null default 'Manual Admin Entry'
                     check (payment_method in ('GCash', 'Maya', 'Manual Admin Entry', 'Bank Transfer', 'Cash', 'Other')),
  status             text not null default 'pending' check (status in ('pending', 'verified', 'failed')),
  proof_of_payment_url text,
  notes              text,
  created_at         timestamptz not null default now()
);

comment on column public.contributions.status is 'pending | verified | failed (verified by admin)';

create index if not exists contributions_user_idx on public.contributions (user_id, payment_date desc);
create index if not exists contributions_cycle_idx on public.contributions (cycle_id);
create index if not exists contributions_status_idx on public.contributions (status, created_at desc);

-- ============================================================================
-- SECTION 5: DISTRIBUTIONS
-- ============================================================================
create table if not exists public.distributions (
  id                 uuid primary key default gen_random_uuid(),
  cycle_id           uuid not null references public.cycles (id) on delete cascade,
  recipient_user_id  uuid not null references public.profiles (id) on delete cascade,
  amount             numeric(12,2) not null check (amount >= 0),
  disbursement_date  timestamptz,
  status             text not null default 'scheduled'
                     check (status in ('scheduled', 'disbursed', 'pending_verification')),
  reference_number   text,
  created_at         timestamptz not null default now(),
  constraint distributions_cycle_recipient_unique unique (cycle_id, recipient_user_id)
);

comment on column public.distributions.amount is 'Total pooled amount disbursed';
comment on column public.distributions.status is 'scheduled | disbursed | pending_verification';

create index if not exists distributions_cycle_idx on public.distributions (cycle_id);
create index if not exists distributions_recipient_idx on public.distributions (recipient_user_id);
create index if not exists distributions_status_idx on public.distributions (status, disbursement_date);

-- ============================================================================
-- SECTION 6: INSURANCE & NOTIFICATIONS
-- ============================================================================
create table if not exists public.insurance_policies (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  coverage_type   text not null
                  check (coverage_type in ('Life Insurance', 'Accident Coverage', 'Health Protection', 'Other')),
  coverage_amount numeric(12,2) not null default 0 check (coverage_amount >= 0),
  premium_amount  numeric(12,2) not null default 0 check (premium_amount >= 0),
  status          text not null default 'active' check (status in ('active', 'lapsed', 'expired', 'cancelled')),
  start_date      date not null default current_date,
  end_date        date,
  created_at      timestamptz not null default now(),
  constraint insurance_policies_user_coverage_unique unique (user_id, coverage_type)
);

create index if not exists insurance_policies_user_idx on public.insurance_policies (user_id);
create index if not exists insurance_policies_status_idx on public.insurance_policies (status);

create table if not exists public.insurance_claims (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  claim_type    text not null
                check (claim_type in ('Life Insurance', 'Accident Coverage', 'Health Protection', 'Other')),
  description   text not null,
  status        text not null default 'submitted'
                check (status in ('submitted', 'under_review', 'approved', 'rejected')),
  documents_url text[] not null default '{}',
  submitted_at  timestamptz not null default now(),
  updated_at    timestamptz
);

comment on column public.insurance_claims.status is 'submitted | under_review | approved | rejected';

create index if not exists insurance_claims_user_idx on public.insurance_claims (user_id, submitted_at desc);
create index if not exists insurance_claims_status_idx on public.insurance_claims (status, submitted_at desc);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null
             check (type in ('contribution_reminder', 'schedule_update', 'payment_alert', 'announcement')),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column public.notifications.type is 'contribution_reminder | schedule_update | payment_alert | announcement';

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where is_read = false;

create table if not exists public.notification_preferences (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null
             check (type in ('contribution_reminder', 'schedule_update', 'payment_alert', 'announcement')),
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);

-- ============================================================================
-- SECTION 7: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Authorization helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.is_cycle_member(p_cycle_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cycle_members cm
    where cm.cycle_id = p_cycle_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Guard: members may edit only their own contact details, never role/status
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.created_at is distinct from old.created_at then
    raise exception 'Not allowed to change protected profile fields';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- New auth user -> profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, mobile_number, birthdate, address, role, status
  ) values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, new.phone, 'member'), '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'mobile_number', ''),
      nullif(new.email, ''),
      nullif(new.phone, '')
    ),
    nullif(new.raw_user_meta_data ->> 'birthdate', '')::date,
    nullif(new.raw_user_meta_data ->> 'address', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'member'),
    case
      when coalesce(new.raw_user_meta_data ->> 'self_signup', 'false') = 'true'
        then 'pending'
      else 'active'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Contribution verified/failed -> member notification
create or replace function public.on_contribution_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle_title text;
begin
  if new.status is distinct from old.status then
    select title into v_cycle_title from public.cycles where id = new.cycle_id;

    if new.status = 'verified' then
      insert into public.notifications (user_id, title, message, type)
      values (
        new.user_id,
        'Contribution Verified',
        format('Your contribution of ₱%s for %s has been verified.',
               trim(to_char(new.amount, 'FM999,999,990.00')),
               coalesce(v_cycle_title, 'your cycle')),
        'payment_alert'
      );
    elsif new.status = 'failed' then
      insert into public.notifications (user_id, title, message, type)
      values (
        new.user_id,
        'Contribution Needs Attention',
        format('Your contribution of ₱%s for %s could not be verified. Please contact support.',
               trim(to_char(new.amount, 'FM999,999,990.00')),
               coalesce(v_cycle_title, 'your cycle')),
        'payment_alert'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_contribution_status_change on public.contributions;
create trigger on_contribution_status_change
  after update of status on public.contributions
  for each row execute function public.on_contribution_status_change();

-- Distribution lifecycle
create or replace function public.before_distribution_update()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'disbursed' and new.disbursement_date is null then
    new.disbursement_date := now();
  end if;
  return new;
end;
$$;

drop trigger if exists before_distribution_update on public.distributions;
create trigger before_distribution_update
  before update on public.distributions
  for each row execute function public.before_distribution_update();

create or replace function public.on_distribution_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout_date date;
  v_amount numeric(12,2);
begin
  if tg_op = 'INSERT' then
    v_amount := new.amount;
    select cm.payout_date into v_payout_date
    from public.cycle_members cm
    where cm.cycle_id = new.cycle_id and cm.user_id = new.recipient_user_id;

    insert into public.notifications (user_id, title, message, type)
    values (
      new.recipient_user_id,
      'Distribution Scheduled',
      format('Your scheduled payout of ₱%s is set for %s.',
             trim(to_char(v_amount, 'FM999,999,990.00')),
             case when v_payout_date is null
                  then 'your assigned payout date'
                  else to_char(v_payout_date, 'FMMonth FMDD, YYYY') end),
      'schedule_update'
    );
    return new;
  end if;

  if old.status is distinct from 'disbursed' and new.status = 'disbursed' then
    update public.cycle_members
    set status = 'completed'
    where cycle_id = new.cycle_id
      and user_id = new.recipient_user_id;

    insert into public.notifications (user_id, title, message, type)
    values (
      new.recipient_user_id,
      'Fund Distribution Disbursed',
      format('Your pooled payout of ₱%s has been disbursed.%s',
             trim(to_char(new.amount, 'FM999,999,990.00')),
             case when new.reference_number is null
                  then ''
                  else ' Reference: ' || new.reference_number end),
      'payment_alert'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_distribution_insert on public.distributions;
create trigger on_distribution_insert
  after insert on public.distributions
  for each row execute function public.on_distribution_change();

drop trigger if exists on_distribution_status_change on public.distributions;
create trigger on_distribution_status_change
  after update of status on public.distributions
  for each row execute function public.on_distribution_change();

-- Claims updated_at
drop trigger if exists set_insurance_claims_updated_at on public.insurance_claims;
create trigger set_insurance_claims_updated_at
  before update on public.insurance_claims
  for each row execute function public.set_updated_at();

-- Notification preferences filter
create or replace function public.filter_notification_by_preference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
begin
  select np.enabled into v_enabled
  from public.notification_preferences np
  where np.user_id = new.user_id
    and np.type = new.type;

  if coalesce(v_enabled, true) = false then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists filter_notification_by_preference on public.notifications;
create trigger filter_notification_by_preference
  before insert on public.notifications
  for each row execute function public.filter_notification_by_preference();

-- RPC: mark notifications as read
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.notifications
  set is_read = true
  where user_id = auth.uid()
    and is_read = false
    and (p_ids is null or id = any (p_ids));

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.mark_notifications_read(uuid[]) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_cycle_member(uuid) to authenticated;

-- ============================================================================
-- SECTION 8: VIEWS
-- ============================================================================

create or replace view public.member_savings
with (security_invoker = on) as
select
  p.id                                               as user_id,
  p.full_name,
  coalesce(sum(case when c.status = 'verified' then c.amount else 0 end), 0)::numeric(14,2)
                                                     as total_verified_savings,
  coalesce(sum(case when c.status = 'pending'  then c.amount else 0 end), 0)::numeric(14,2)
                                                     as total_pending_savings,
  count(c.id)                                        as contribution_count,
  count(c.id) filter (where c.status = 'pending')    as pending_contribution_count,
  count(c.id) filter (where c.status = 'verified')   as verified_contribution_count
from public.profiles p
left join public.contributions c on c.user_id = p.id
group by p.id, p.full_name;

create or replace view public.cycle_pool_totals
with (security_invoker = on) as
select
  c.id                    as cycle_id,
  c.title,
  c.contribution_amount,
  c.frequency,
  c.start_date,
  c.end_date,
  c.status,
  (select count(*) from public.cycle_members cm where cm.cycle_id = c.id)
                                                  as member_count,
  (select count(*) from public.cycle_members cm where cm.cycle_id = c.id and cm.status = 'active')
                                                  as active_member_count,
  (select count(*) from public.cycle_members cm where cm.cycle_id = c.id and cm.status = 'completed')
                                                  as completed_slot_count,
  (select coalesce(sum(ct.amount), 0) from public.contributions ct
     where ct.cycle_id = c.id and ct.status = 'verified')::numeric(14,2)
                                                  as total_verified_contributions,
  (select coalesce(sum(ct.amount), 0) from public.contributions ct
     where ct.cycle_id = c.id and ct.status = 'pending')::numeric(14,2)
                                                  as total_pending_contributions,
  ((select count(*) from public.cycle_members cm where cm.cycle_id = c.id)
     * c.contribution_amount
     * (case
          when c.frequency = 'monthly'
            then greatest(1, ((extract(year from age(c.end_date, c.start_date)) * 12
                               + extract(month from age(c.end_date, c.start_date)))::int + 1))
          else greatest(1, (floor(extract(day from age(c.end_date, c.start_date)) / 14)::int + 1))
        end))::numeric(14,2)                      as expected_pool_amount,
  (select count(*) from public.contributions ct where ct.cycle_id = c.id and ct.status = 'pending')
                                                  as pending_contribution_count
from public.cycles c;

create or replace view public.member_cycle_enrollment
with (security_invoker = on) as
select
  cm.user_id,
  cm.slot_number,
  cm.payout_date,
  cm.status                  as member_status,
  c.id                       as cycle_id,
  c.title                    as cycle_title,
  c.contribution_amount,
  c.frequency,
  c.start_date,
  c.end_date,
  c.status                   as cycle_status
from public.cycle_members cm
join public.cycles c on c.id = cm.cycle_id;

create or replace view public.cycle_payout_schedule
with (security_invoker = on) as
select
  d.cycle_id,
  d.recipient_user_id,
  d.amount,
  d.disbursement_date,
  d.status                   as distribution_status,
  d.reference_number,
  cm.slot_number,
  cm.payout_date,
  cm.user_id                 as viewer_slot_user_id,
  case when cm.user_id = auth.uid() then true else false end as is_own_slot
from public.distributions d
join public.cycle_members cm
  on cm.cycle_id = d.cycle_id and cm.user_id = d.recipient_user_id;

create or replace view public.member_coverage
with (security_invoker = on) as
select
  p.id                              as user_id,
  p.full_name,
  coalesce(sum(case when ip.status = 'active' then ip.coverage_amount else 0 end), 0)::numeric(14,2)
                                     as active_coverage_amount,
  count(ip.id) filter (where ip.status = 'active')
                                     as active_policy_count,
  count(ic.id) filter (where ic.status in ('submitted', 'under_review'))
                                     as open_claim_count
from public.profiles p
left join public.insurance_policies ip on ip.user_id = p.id
left join public.insurance_claims ic on ic.user_id = p.id
group by p.id, p.full_name;

-- ============================================================================
-- SECTION 9: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- cycles
alter table public.cycles enable row level security;

drop policy if exists "cycles_select" on public.cycles;
create policy "cycles_select" on public.cycles
  for select to authenticated
  using (true);

drop policy if exists "cycles_admin_all" on public.cycles;
create policy "cycles_admin_all" on public.cycles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- cycle_members
alter table public.cycle_members enable row level security;

drop policy if exists "cycle_members_select" on public.cycle_members;
create policy "cycle_members_select" on public.cycle_members
  for select to authenticated
  using (public.is_admin() or public.is_cycle_member(cycle_id));

drop policy if exists "cycle_members_admin_all" on public.cycle_members;
create policy "cycle_members_admin_all" on public.cycle_members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- contributions
alter table public.contributions enable row level security;

drop policy if exists "contributions_select" on public.contributions;
create policy "contributions_select" on public.contributions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "contributions_insert" on public.contributions;
create policy "contributions_insert" on public.contributions
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "contributions_update_own_pending" on public.contributions;
create policy "contributions_update_own_pending" on public.contributions
  for update to authenticated
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "contributions_admin_all" on public.contributions;
create policy "contributions_admin_all" on public.contributions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- distributions
alter table public.distributions enable row level security;

drop policy if exists "distributions_select" on public.distributions;
create policy "distributions_select" on public.distributions
  for select to authenticated
  using (
    recipient_user_id = auth.uid()
    or public.is_admin()
    or public.is_cycle_member(cycle_id)
  );

drop policy if exists "distributions_admin_all" on public.distributions;
create policy "distributions_admin_all" on public.distributions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- insurance_policies
alter table public.insurance_policies enable row level security;

drop policy if exists "insurance_policies_select" on public.insurance_policies;
create policy "insurance_policies_select" on public.insurance_policies
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "insurance_policies_admin_all" on public.insurance_policies;
create policy "insurance_policies_admin_all" on public.insurance_policies
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- insurance_claims
alter table public.insurance_claims enable row level security;

drop policy if exists "insurance_claims_select" on public.insurance_claims;
create policy "insurance_claims_select" on public.insurance_claims
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "insurance_claims_insert" on public.insurance_claims;
create policy "insurance_claims_insert" on public.insurance_claims
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'submitted');

drop policy if exists "insurance_claims_update_own_submitted" on public.insurance_claims;
create policy "insurance_claims_update_own_submitted" on public.insurance_claims
  for update to authenticated
  using (user_id = auth.uid() and status = 'submitted')
  with check (user_id = auth.uid() and status = 'submitted');

drop policy if exists "insurance_claims_admin_all" on public.insurance_claims;
create policy "insurance_claims_admin_all" on public.insurance_claims
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- notifications
alter table public.notifications enable row level security;

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_admin_all" on public.notifications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- notification_preferences
alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_own" on public.notification_preferences;
create policy "notification_preferences_own" on public.notification_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notification_preferences_admin_select" on public.notification_preferences;
create policy "notification_preferences_admin_select" on public.notification_preferences
  for select to authenticated
  using (public.is_admin());

-- ============================================================================
-- SECTION 10: DEMO SEED DATA
-- ============================================================================

begin;

-- Auth users with hashed passwords
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'admin@isin.ph',
   crypt('Admin123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"System Admin","mobile_number":"09170000000","role":"admin"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', '09171234567@members.isin.local',
   crypt('Member123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Juan Dela Cruz","mobile_number":"09171234567","birthdate":"1990-04-12","address":"123 Rizal St, Quezon City"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', '09181234568@members.isin.local',
   crypt('Member123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Maria Santos","mobile_number":"09181234568","birthdate":"1985-09-23","address":"45 Bonifacio Ave, Pasig City"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000003',
   'authenticated', 'authenticated', '09191234569@members.isin.local',
   crypt('Member123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Jose Ramos","mobile_number":"09191234569","birthdate":"1993-02-08","address":"78 Mabini St, Marikina City"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000004',
   'authenticated', 'authenticated', '09201234570@members.isin.local',
   crypt('Member123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Ana Reyes","mobile_number":"09201234570","birthdate":"1998-11-30","address":"32 Sampaguita St, Caloocan City"}',
   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000005',
   'authenticated', 'authenticated', '09211234571@members.isin.local',
   crypt('Member123!', gen_salt('bf')), now(),
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

-- Cycles
insert into public.cycles (id, title, contribution_amount, frequency, start_date, end_date, status)
values
  ('30000000-0000-4000-8000-000000000001', 'Paluwagan Batch 2025-A', 500.00, 'monthly',
   date '2025-01-15', date '2025-04-15', 'completed'),
  ('30000000-0000-4000-8000-000000000002', 'Paluwagan Batch 2026-A', 500.00, 'monthly',
   date '2026-09-15', date '2027-04-15', 'active'),
  ('30000000-0000-4000-8000-000000000003', 'Paluwagan Batch 2026-B', 500.00, 'bi-weekly',
   date '2026-11-01', date '2027-03-15', 'draft')
on conflict (id) do nothing;

-- Cycle member assignments
insert into public.cycle_members (cycle_id, user_id, slot_number, payout_date, status)
select * from (values
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 1, date '2025-04-15', 'completed'),
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 2, date '2025-05-15', 'completed'),
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 3, date '2025-06-15', 'completed'),
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, 4, date '2025-07-15', 'completed'),
  ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000005'::uuid, 5, date '2025-08-15', 'completed'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 1, date '2026-12-15', 'active'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 2, date '2027-01-15', 'active'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 3, date '2027-02-15', 'active'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, 4, date '2027-03-15', 'active'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000005'::uuid, 5, date '2027-04-15', 'active')
) as t(cycle_id, user_id, slot_number, payout_date, status)
on conflict do nothing;

-- Contributions for completed 2025-A cycle
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

-- Contributions for active 2026-A cycle
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

-- Distributions
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

-- Insurance policies
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

-- Insurance claims
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

-- Notifications
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

-- Notification preferences
insert into public.notification_preferences (user_id, type, enabled)
values
  ('20000000-0000-4000-8000-000000000005', 'announcement', false),
  ('20000000-0000-4000-8000-000000000005', 'contribution_reminder', true),
  ('20000000-0000-4000-8000-000000000005', 'schedule_update', true),
  ('20000000-0000-4000-8000-000000000005', 'payment_alert', true)
on conflict (user_id, type) do nothing;

commit;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your iSIN database is ready with demo data.
--
-- Login credentials:
--   Admin:  admin@isin.ph / Admin123!
--   Member: 09171234567@members.isin.local / Member123!
--   (and 4 more member accounts - see header comments)
-- ============================================================================
