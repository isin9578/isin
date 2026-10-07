-- iSIN: Paluwagan cycles (savings pools) and their member slots
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
