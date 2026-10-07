-- iSIN: helper functions, auth trigger and business-event triggers

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER so they can be safely referenced
-- inside RLS policies without recursion)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Guard: members may edit only their own contact details, never role/status
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- New auth user -> profile row
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Contribution verified/failed -> member notification
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Distribution lifecycle: normalize date, close the slot, notify recipient
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Claims updated_at + respect per-member notification preferences
-- ---------------------------------------------------------------------------
drop trigger if exists set_insurance_claims_updated_at on public.insurance_claims;
create trigger set_insurance_claims_updated_at
  before update on public.insurance_claims
  for each row execute function public.set_updated_at();

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
    return null; -- member opted out of this notification type
  end if;
  return new;
end;
$$;

drop trigger if exists filter_notification_by_preference on public.notifications;
create trigger filter_notification_by_preference
  before insert on public.notifications
  for each row execute function public.filter_notification_by_preference();

-- ---------------------------------------------------------------------------
-- RPC: mark the caller's notifications as read
-- ---------------------------------------------------------------------------
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
