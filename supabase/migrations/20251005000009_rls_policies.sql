-- iSIN: Row Level Security
-- Members can only read their own financial records; admins have full access.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
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

-- no delete policy: profiles are removed only through auth.users cascade (service role)

-- ---------------------------------------------------------------------------
-- cycles
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- cycle_members (slot assignments)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- contributions
-- ---------------------------------------------------------------------------
alter table public.contributions enable row level security;

drop policy if exists "contributions_select" on public.contributions;
create policy "contributions_select" on public.contributions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "contributions_insert" on public.contributions;
create policy "contributions_insert" on public.contributions
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Members may edit only their own PENDING submission (e.g. fix proof URL);
-- status can never be changed to verified by the member themselves.
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

-- ---------------------------------------------------------------------------
-- distributions
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- insurance_policies
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- insurance_claims
-- ---------------------------------------------------------------------------
alter table public.insurance_claims enable row level security;

drop policy if exists "insurance_claims_select" on public.insurance_claims;
create policy "insurance_claims_select" on public.insurance_claims
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "insurance_claims_insert" on public.insurance_claims;
create policy "insurance_claims_insert" on public.insurance_claims
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'submitted');

-- Members can edit/withdraw only while the claim is still 'submitted';
-- admins move claims through under_review / approved / rejected.
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

-- ---------------------------------------------------------------------------
-- notifications (members read/mark their own; system + admin create)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- notification_preferences (mobile Notification Settings toggles)
-- ---------------------------------------------------------------------------
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

