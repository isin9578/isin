-- iSIN: member/admin profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null,
  mobile_number text not null unique,
  birthdate     date,
  address       text,
  role          text not null default 'member' check (role in ('member', 'admin')),
  -- 'pending' = self-registered, awaiting admin approval; managed by admin panel
  status        text not null default 'active' check (status in ('pending', 'active', 'suspended')),
  created_at    timestamptz not null default now()
);

comment on column public.profiles.role is 'member | admin';
comment on column public.profiles.status is 'pending | active | suspended (approval state for member accounts)';

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
