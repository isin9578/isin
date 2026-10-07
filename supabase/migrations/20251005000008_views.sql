-- iSIN: read-model views (security_invoker so member RLS still applies)

-- Total savings per member (verified contributions = savings balance)
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

-- Pool totals per cycle for the admin "Contribution Pool" and distribution screens
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
          else greatest(1, (floor(extract(day from (c.end_date - c.start_date)) / 14)::int + 1))
        end))::numeric(14,2)                      as expected_pool_amount,
  (select count(*) from public.contributions ct where ct.cycle_id = c.id and ct.status = 'pending')
                                                  as pending_contribution_count
from public.cycles c;

-- The member's own cycle enrollment (slot, payout date, contribution terms)
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

-- Payout schedule of the viewer's cycle (slot order + status, no other member PII)
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

-- Coverage summary per member for the Insurance screens
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
