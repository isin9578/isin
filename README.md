# iSIN — Save Today, Be Protected Tomorrow

Digital **Paluwagan (savings pool)** + **micro-insurance** app. There are **no loan features** — the product revolves exclusively around pooled contributions, scheduled distribution (sahod), insurance protection, and transaction monitoring.

TypeScript across the whole stack.

```
iSIN/
├── supabase/          # SQL migrations, seed data, canonical TS types
│   ├── migrations/    # 9 migrations (schema, triggers, views, RLS)
│   ├── seed.sql       # demo data: 6 users, 3 cycles, contributions, claims
│   └── types/         # database.types.ts (single source of truth)
├── admin/             # Next.js 16 + Tailwind v4 admin panel (desktop)
├── mobile/            # Expo SDK 57 / React Native member app
└── scripts/
    └── sync-types.mjs # copies supabase/types → admin/ + mobile/
```

## Demo mode (no backend required)

Both apps run against in-memory fixtures mirroring `supabase/seed.sql` whenever the Supabase env vars are **unset or placeholders** (`''`, `your-project.supabase.co`, `https://your-project.supabase.co`, `your-anon-key`). This lets you review the full UI without a Supabase project.

| Account | Credentials |
| --- | --- |
| Admin | `admin@isin.ph` / `Admin123!` |
| Member (mobile login via mobile number) | `09171234567` / `Member123!` (all demo members) |

Mobile login maps the mobile number to the email `${digits}@members.isin.local`.

## Quick start

### Admin panel

```bash
cd admin
npm install
npm run dev          # http://localhost:3100
```

Optional live backend: copy `.env.local.example` → `.env.local` and fill in your Supabase project values (Project Settings → API).

### Mobile app

```bash
cd mobile
npm install
npm run web          # http://localhost:8082  (fastest for review)
npm start            # Expo dev server for iOS/Android simulators
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `mobile/.env` to go live; leave unset for demo mode.

## Supabase setup

1. Create a Supabase project.
2. Apply migrations in order (either via Dashboard → SQL Editor, or the CLI):

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db reset        # applies supabase/migrations/* then supabase/seed.sql
   ```

3. Seed data (if applying manually): run `supabase/seed.sql` after the migrations.
4. Copy the project URL + keys into `admin/.env.local` and `mobile/.env`.

### Schema (7 core tables + 2 supporting)

- `profiles` (references `auth.users`; `role` = `member` | `admin`, `status` = `pending` | `active` | `suspended`)
- `cycles` — Paluwagan batches (`contribution_amount`, `frequency` monthly/bi-weekly, date range, status)
- `cycle_members` — slot number + scheduled `payout_date` per member
- `contributions` — amount, payment method (GCash/Maya/Manual), `pending` | `verified` | `failed`, proof URL
- `distributions` — pooled payout per recipient, `scheduled` | `disbursed` | `pending_verification`, reference number
- `insurance_claims` — claim type, description, `documents_url[]`, `submitted` | `under_review` | `approved` | `rejected`
- `notifications` — typed feeds with `is_read`
- Supporting: `insurance_policies` (coverage tracking), `notification_preferences` (4 toggles)

### Triggers, functions & views

- `is_admin()` / `is_cycle_member()` security-definer helpers used by RLS.
- Profile field-protection trigger; `handle_new_user()` auth trigger.
- Contribution status change → notification; distribution lifecycle → completes the slot + notifies.
- Notification-preference filter; `mark_notifications_read()` RPC.
- Views (all `security_invoker = on`): `member_savings`, `cycle_pool_totals` (frequency-aware `expected_pool_amount`), `member_cycle_enrollment`, `cycle_payout_schedule`, `member_coverage`.

### Row Level Security

Every table has RLS enabled: **members can only read/update their own financial records** (own `user_id`/`profile` rows), while **admins (`role = 'admin'`) have full read/write**. The admin panel's server code uses the service-role key (server-only, never shipped to the browser) for privileged writes such as approving members and verifying contributions.

### TypeScript types

`supabase/types/database.types.ts` is canonical. After editing it:

```bash
node scripts/sync-types.mjs
```

copies it to `admin/src/lib/database.types.ts` and `mobile/src/types/database.types.ts`.

## Admin panel flows (desktop)

| Route | Flow |
| --- | --- |
| `/login` | Admin sign-in (demo session = httpOnly cookie) |
| `/` | Dashboard: total verified savings, pending review, pool health |
| `/members` | View / register / approve members, assign cycle + slot + payout date |
| `/cycles` | Create cycles, manage slot rosters |
| `/contributions` | Tabs by status; verify or reject ₱500 receipts (updates balances) |
| `/distributions` | Monitor monthly pool totals; log/disburse payouts |
| `/insurance` | Coverage table + claim state transitions (submit → review → approve/reject) |
| `/notifications` | Broadcast announcements / reminders to mobile users |

## Mobile app flows (member)

Splash → Login / Register → bottom tabs **Home · Services · History · Profile**, plus Contributions, Distributions, Insurance, Transactions, Notifications, Support, and the Main Objective (two pillars: Saving + Protection) screens. Contribution modal collects GCash/Maya/Cash + proof URL; claims submit through Claims Assistance.

## Deployment (Railway)

The admin panel is a standard Next.js app and deploys to Railway as a Web Service.

### 📚 Complete Deployment Guides

We've created comprehensive deployment documentation:

| Guide | Use When | Time |
|-------|----------|------|
| **[RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md)** | You want to deploy fast (5 minutes) | 10-15 min |
| **[RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)** | You need detailed instructions | 30-45 min |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | You want a step-by-step checklist | 30-45 min |
| **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** | You want an overview of everything | Reference |

### ⚡ Quick Deploy (TL;DR)

1. **Database:** Run `supabase/complete-isin-setup.sql` in Supabase SQL Editor
2. **Railway:** Deploy from GitHub, set root directory to `admin`
3. **Environment Variables:**
   ```bash
   NODE_VERSION=20
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
4. **Auth Configuration:** Add Railway URL to Supabase redirect URLs
5. **Test:** Login with `admin@isin.ph` / `Admin123!`

### 📁 Deployment Files Included

- `admin/railway.json` - Railway build configuration
- `admin/.railwayignore` - Exclude files from deployment
- `admin/.env.railway.example` - Environment variables template
- `mobile/railway.json` - Mobile web deployment config
- `supabase/complete-isin-setup.sql` - Complete database setup (schema + seed)

### 🎯 Demo Mode

Omit the Supabase vars entirely to deploy the panel in **demo mode** (the demo session is a plain httpOnly cookie — fine for review deployments; set the Supabase vars for anything real).

### 📱 Mobile App Distribution

The Expo app doesn't need a server. For distribution use **EAS Build**:

```bash
cd mobile
npm install -g eas-cli
eas build --platform android --profile preview   # APK for sharing
eas build --platform ios
```

Alternatively, deploy the web version to Railway (see `mobile/railway.json`).

For detailed deployment instructions, see **[RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md)**.

## Verification status

- `admin`: `next build` ✅ (18 pages), `tsc --noEmit` ✅, eslint 0 errors / 0 warnings ✅; all 7 panel routes render with data in demo mode; login → dashboard verified in-browser.
- `mobile`: `tsc --noEmit` ✅; Expo web bundles and serves (HTTP 200).
