-- iSIN: pooled savings contributions (NO loan features anywhere in this system)
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
