# 📋 iSIN Deployment Checklist

Complete checklist for deploying iSIN to Railway + Supabase

---

## Phase 1: Pre-Deployment Setup

### 1.1 Supabase Database Setup
- [ ] Create Supabase project at https://supabase.com
- [ ] Copy project reference ID
- [ ] Note down Project URL from Settings → API
- [ ] Copy `anon` (public) key from Settings → API
- [ ] Copy `service_role` (secret) key from Settings → API

### 1.2 Apply Database Schema
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Open `supabase/complete-isin-setup.sql`
- [ ] Copy entire file content
- [ ] Paste into SQL Editor
- [ ] Click **Run** or press Ctrl+Enter
- [ ] Verify no errors in output
- [ ] Check Tables section - should show 9 tables

### 1.3 Verify Database Setup
- [ ] Go to Authentication → Users
- [ ] Should see 6 users (1 admin + 5 members)
- [ ] Go to Table Editor → profiles
- [ ] Should see 6 profiles
- [ ] Go to Table Editor → cycles
- [ ] Should see 3 cycles

---

## Phase 2: GitHub Repository

### 2.1 Initialize Git (if not done)
```bash
cd d:\iSIN
git init
git add .
git commit -m "Initial commit: iSIN project"
```

### 2.2 Create GitHub Repository
- [ ] Go to https://github.com/new
- [ ] Repository name: `isin` (or your choice)
- [ ] Set to Private or Public
- [ ] Do NOT initialize with README (already have one)
- [ ] Click Create repository

### 2.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/isin.git
git branch -M main
git push -u origin main
```

- [ ] Verify files pushed successfully
- [ ] Check GitHub shows all folders: admin, mobile, supabase, scripts

---

## Phase 3: Railway - Admin Panel Deployment

### 3.1 Create Railway Project
- [ ] Go to https://railway.app/new
- [ ] Click **Deploy from GitHub repo**
- [ ] Authorize Railway to access GitHub
- [ ] Select your `isin` repository
- [ ] Wait for Railway to import

### 3.2 Configure Admin Service
- [ ] Click on the created service
- [ ] Go to **Settings** tab
- [ ] Service Name: `isin-admin` (or your choice)
- [ ] Root Directory: `admin`
- [ ] Click **Save**

### 3.3 Set Environment Variables
- [ ] Click **Variables** tab
- [ ] Click **+ New Variable** or **RAW Editor**
- [ ] Add these variables:

```bash
NODE_VERSION=20
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

- [ ] Click **Add** or **Save**
- [ ] Railway should auto-deploy

### 3.4 Monitor Deployment
- [ ] Click **Deployments** tab
- [ ] Watch build logs (should take 2-3 minutes)
- [ ] Wait for status: **SUCCESS**
- [ ] Copy the deployment URL (e.g., `https://isin-admin-production-xxxx.up.railway.app`)

### 3.5 Generate Public URL (if needed)
- [ ] Go to **Settings** tab
- [ ] Scroll to **Networking** section
- [ ] Click **Generate Domain**
- [ ] Copy the generated URL

---

## Phase 4: Supabase Authentication Configuration

### 4.1 Configure Auth URLs
- [ ] Go back to Supabase Dashboard
- [ ] Navigate to **Authentication** → **URL Configuration**

### 4.2 Set Site URL
- [ ] In **Site URL** field, enter:
```
https://your-railway-url.up.railway.app
```
- [ ] Click **Save**

### 4.3 Set Redirect URLs
- [ ] In **Redirect URLs** section, add these (one per line):
```
https://your-railway-url.up.railway.app/*
https://your-railway-url.up.railway.app/api/auth/callback
http://localhost:3100/*
http://localhost:3100/api/auth/callback
```
- [ ] Click **Save**

---

## Phase 5: Test Admin Panel Deployment

### 5.1 Access Deployment
- [ ] Open Railway URL in browser
- [ ] Should see iSIN login page
- [ ] No console errors in browser DevTools

### 5.2 Test Admin Login
- [ ] Email: `admin@isin.ph`
- [ ] Password: `Admin123!`
- [ ] Click Login
- [ ] Should redirect to dashboard

### 5.3 Verify Pages Load
- [ ] Dashboard - shows stats and charts
- [ ] Members - shows 5 demo members
- [ ] Cycles - shows 3 cycles
- [ ] Contributions - shows pending contributions
- [ ] Distributions - shows distribution schedule
- [ ] Insurance - shows policies and claims
- [ ] Notifications - can send broadcasts

### 5.4 Test Key Functions
- [ ] Try verifying a pending contribution
- [ ] Try approving/suspending a member
- [ ] Try sending a notification
- [ ] Check all modals open/close properly

---

## Phase 6: Mobile App Deployment (Optional)

### 6.1 Create Mobile Service (Web Version)
- [ ] Railway Dashboard → Click **+ New**
- [ ] Select same GitHub repository
- [ ] Click the new service
- [ ] Settings → Root Directory: `mobile`
- [ ] Service Name: `isin-mobile-web`

### 6.2 Set Mobile Environment Variables
- [ ] Click **Variables** tab
- [ ] Add:
```bash
NODE_VERSION=20
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### 6.3 Test Mobile Web Deployment
- [ ] Wait for deployment to complete
- [ ] Open mobile Railway URL
- [ ] Should see mobile app interface
- [ ] Test member login: `09171234567` / `Member123!`

---

## Phase 7: Production Readiness

### 7.1 Security Review
- [ ] Verify service role key is NOT exposed in client
- [ ] Check RLS policies are enabled on all tables
- [ ] Verify admin routes require authentication
- [ ] Test that members can't access other members' data

### 7.2 Performance Check
- [ ] Test page load times (should be < 3 seconds)
- [ ] Check Railway metrics (CPU, Memory usage)
- [ ] Verify database queries are efficient

### 7.3 Custom Domain (Optional)
- [ ] Purchase/configure domain
- [ ] Railway → Settings → Domains → Custom Domain
- [ ] Add CNAME record to DNS
- [ ] Update Supabase redirect URLs with new domain

### 7.4 Monitoring Setup
- [ ] Set up Railway alerts for errors
- [ ] Configure Supabase log alerts
- [ ] Test error reporting works

---

## Phase 8: Documentation & Handoff

### 8.1 Update Documentation
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] List all environment variables
- [ ] Create admin user guide

### 8.2 Credentials Management
- [ ] Store Supabase credentials securely
- [ ] Document Railway access
- [ ] Share admin credentials with team
- [ ] Set up password rotation policy

### 8.3 Training
- [ ] Train admins on panel usage
- [ ] Document common workflows
- [ ] Create troubleshooting guide

---

## Phase 9: Post-Deployment Monitoring

### 9.1 Week 1 Checklist
- [ ] Monitor Railway deployment logs daily
- [ ] Check Supabase usage metrics
- [ ] Review error logs
- [ ] Test all critical paths

### 9.2 Week 2 Checklist
- [ ] Review performance metrics
- [ ] Check database size growth
- [ ] Verify backups are working
- [ ] Update dependencies if needed

---

## 🚨 Rollback Plan

If deployment fails or issues arise:

### Railway Rollback
1. Railway Dashboard → Deployments
2. Click previous successful deployment
3. Click **Redeploy**

### Database Rollback
1. Supabase Dashboard → Database → Backups
2. Select restore point
3. Confirm restore

### Emergency Contact
- Railway Status: https://status.railway.app
- Supabase Status: https://status.supabase.com

---

## ✅ Deployment Complete!

All phases completed? Your iSIN platform is live! 🎉

### Access Points:
- **Admin Panel:** `https://your-admin-url.up.railway.app`
- **Mobile Web:** `https://your-mobile-url.up.railway.app` (if deployed)
- **Supabase Dashboard:** `https://supabase.com/dashboard/project/YOUR_PROJECT`

### Next Steps:
1. Change default admin password
2. Create real admin users
3. Start onboarding real members
4. Monitor system health

---

## 📞 Support Resources

- **Railway Docs:** https://docs.railway.app
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Expo Docs:** https://docs.expo.dev

---

## 📊 Success Metrics

Track these to ensure healthy deployment:

- [ ] 99%+ uptime
- [ ] < 3s average page load
- [ ] Zero critical errors in logs
- [ ] Positive user feedback
- [ ] All features functional

---

**Last Updated:** [Date]  
**Deployed By:** [Name]  
**Version:** 1.0.0
