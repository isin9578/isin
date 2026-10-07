# iSIN Research Questions
### Study: Digital Paluwagan (Savings Pool) & Micro-Insurance Management System

These questions are written for the researcher to use in interviews, focus group
discussions, or a questionnaire with Paluwagan participants, organizers
(treasurer/admin), and micro-insurance claimants. They are grouped by theme and
ordered from general to specific. Scenario questions use the system's reference
numbers (₱500.00 contribution, 5 members, monthly cycle) so answers are concrete.

---

## Part A — How Paluwagan Works (Mechanics)

1. How does a typical Paluwagan group in your community operate? Walk me through
   it from the first meeting to the last payout.
2. Who are the members, and how are they recruited or chosen? Is trust or
   kinship a condition for joining?
3. How much is the agreed contribution per member, and who holds the money
   during the cycle?
4. How is the payout order (slot) decided — by seniority, raffle, auction, or
   agreement?
5. How does a member know how much they will receive on their payout date?
   Is the amount fixed or does it depend on what was collected?
6. What records are kept today (passbook, notebook, group chat), and how do
   members verify that their payments were recorded correctly?
7. What happens today when a member wants to withdraw early or transfer their
   slot to someone else?
8. What are the biggest problems or sources of conflict you have experienced
   or witnessed in a Paluwagan group?

## Part B — Scheduling (Contributions & Payouts)

9. How is the contribution schedule set — monthly, bi-weekly, aligned with
   salary dates (sahod), or something else? Who decides?
10. How is each member's payout date assigned, and how closely does it follow
    the member's slot order?
11. Is there a grace period for late payments? How long, and who enforces it?
12. What happens to the schedule when a contribution date falls on a holiday,
    or when the group agrees to skip a cycle?
13. How do members currently get reminded of upcoming contribution and payout
    dates? Which method is most effective (text, chat, in-person)?
14. How confident are members that the payout date will be honored exactly as
    scheduled? What causes delays?
15. For a cycle of 5 members paying ₱500 monthly, when should the first payout
    occur, and how do you explain the schedule to a new member?

## Part C — Insurance Protection

16. Does your Paluwagan group currently offer any form of insurance or
    protection to members? If yes, describe it.
17. What types of coverage would members actually value — life, accident,
    health/hospitalization, or other risks (e.g., typhoon, fire)?
18. How much would members be willing to pay for coverage, and should the
    premium be separate from, or deducted from, the Paluwagan contribution?
19. What should happen to a member's savings slot and pending payout if that
    member dies or is disabled during the cycle — should the beneficiary
    receive the pooled amount, the member's own contributions, or nothing?
20. What documents should a member submit for a claim, and who should decide
    whether a claim is approved?
21. How long should a claim review take before members lose trust in the
    system?
22. Who should hold the insurance funds — the group itself, a trusted
    institution, or an external provider — and how should members verify that
    the funds exist?

## Part D — Missed Contributions & Impact on the Current Payout
*(Scenario: 5 members, ₱500 each per month, monthly cycle. Member C does not
pay their contribution for the current month.)*

23. In your group today, what actually happens when a member misses one
    monthly contribution? Who finds out first?
24. **Effect on the pool:** the current recipient's payout is funded by that
    month's pooled contributions. If ₱500 is missing, the pool for the month is
    ₱2,000 instead of ₱2,500. Should the recipient receive the reduced amount,
    or should the group cover the shortfall? Why?
25. Should the missing member be allowed to pay later (back-pay), and if so,
    by when? Should a late fee or interest apply?
26. If the member never pays, what is the fairest consequence — deduction from
    their own future payout, suspension from the cycle, removal from the group,
    or loss of their slot?
27. Should other members be allowed (or required) to advance the missing
    amount? If yes, how is that debt or credit recorded and repaid?
28. Does one missed payment affect only the current recipient, or should it
    affect everyone's expected total? Explain how you would decide.
29. How should members be notified when someone misses a payment, without
    causing conflict or shame within the group?
30. In the iSIN system, a contribution must be **verified by the admin** before
    it counts toward the pool; unverified payments show as *pending* and a
    rejected receipt is marked *failed*. Do you agree that only verified
    contributions should count toward a payout? What could go wrong?
31. If Member C misses the current month but pays double the next month, how
    should the system reflect this — one ₱1,000 record, two ₱500 records, or a
    penalty record? How would you want it shown in the member's history?

## Part E — Digitalization Acceptance (iSIN)

32. Would you trust an app to record your contributions and show the pool
    total? What would you need to see to trust it (receipts, admin approval,
    SMS confirmation)?
33. Which features are most important to you first: contribution recording,
    payout schedule visibility, insurance claims, or notifications?
34. What would make you stop using the app and go back to the paper method?

---

## Interviewer's Notes — How the Current iSIN Build Answers These

Use this only as a reference when probing; do not read it to the respondent.

| Topic | Current system behavior |
| --- | --- |
| Pool total | Sum of **verified** contributions only; pending receipts are shown separately ([views.sql](supabase/migrations/20251005000008_views.sql)) |
| Expected pool | `members × contribution_amount × periods` (frequency-aware: monthly vs bi-weekly) |
| Missed payment | Contribution stays `pending` or is marked `failed` by admin; pool is short by that amount, so the current recipient's disbursement is logged at the actual pooled amount |
| Payout schedule | Per-slot `payout_date` on `cycle_members`, shown to the member and triggerable as `scheduled → disbursed` by admin |
| Insurance | Separate `insurance_policies` (coverage) + `insurance_claims` with states `submitted → under_review → approved/rejected` |
| Reminders | `notifications` table with 4 types + member-controlled preferences |
