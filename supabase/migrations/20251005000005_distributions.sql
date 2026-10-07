-- iSIN: scheduled fund distributions (pooled payout to the slot recipient)
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
