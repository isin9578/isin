-- iSIN: micro-insurance policies, claims, notifications and preferences

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

-- Per-member opt-in/out toggles for the mobile Notification Settings screen
create table if not exists public.notification_preferences (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null
             check (type in ('contribution_reminder', 'schedule_update', 'payment_alert', 'announcement')),
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);
