# iSIN Admin Panel - Railway Deployment Guide

## 🚀 Quick Deploy to Railway

### Prerequisites
- GitHub account with this repo pushed
- Railway account (https://railway.app)
- Supabase project set up with migrations applied

---

## Step-by-Step Deployment

### 1. Create Railway Project

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your `iSIN` repository
4. Railway will detect it as a monorepo

### 2. Configure the Service

#### In Railway Dashboard:

**Service Settings:**
- **Name:** `isin-admin-panel`
- **Root Directory:** `admin`
- **Builder:** NIXPACKS (auto-detected)

**Build Settings:**
```
Build Command: npm ci && npm run build
Start Command: npm run start
```

**Node Version:**
Add this variable to use Node 20+:
```
NODE_VERSION=20
```

### 3. Environment Variables

Go to **Variables** tab and add these:

#### Required for Live Mode:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> **Get these from Supabase:**  
> Dashboard → Project Settings → API

#### Optional (Demo Mode):
Leave the Supabase variables empty or unset to run in demo mode with in-memory fixtures.

### 4. Deploy

Click **"Deploy"** — Railway will:
1. Install dependencies
2. Build Next.js production bundle
3. Start the server
4. Assign a public URL: `https://your-service.up.railway.app`

---

## 🔐 Configure Supabase Authentication

After your first deploy:

1. Copy your Railway URL: `https://your-service.up.railway.app`
2. Go to Supabase → **Authentication** → **URL Configuration**
3. Add to **Redirect URLs:**
   ```
   https://your-service.up.railway.app/api/auth/callback
   https://your-service.up.railway.app/*
   ```
4. Add to **Site URL:**
   ```
   https://your-service.up.railway.app
   ```

---

## 📱 Mobile App Configuration (Optional)

If deploying the mobile web app to Railway:

### Create Second Service:

1. Add new service to same Railway project
2. **Root Directory:** `mobile`
3. **Build Command:** `npm ci && npm run build:web`
4. **Start Command:** Use a static server like:
   ```bash
   npx serve dist -p $PORT
   ```

### Environment Variables for Mobile:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🛠️ Custom Domain (Optional)

1. Railway Dashboard → Service → **Settings** → **Domains**
2. Click **"Generate Domain"** or **"Custom Domain"**
3. Follow DNS configuration steps if using custom domain

---

## 📊 Monitoring & Logs

- **Logs:** Railway Dashboard → Service → **Deployments** → Click deployment
- **Metrics:** View CPU, Memory, Network usage in Railway dashboard
- **Health Check:** Railway automatically monitors your service

---

## 🔄 Continuous Deployment

Railway auto-deploys on every push to your main branch.

**To disable auto-deploy:**
1. Service → **Settings** → **Deploy Triggers**
2. Toggle off **"Auto-deploy"**

**Manual deploy:**
1. Service → **Deployments**
2. Click **"New Deployment"**

---

## 🐛 Troubleshooting

### Build Fails
- Check logs: Railway Dashboard → Deployments → Build Logs
- Verify `package.json` scripts are correct
- Ensure Node version is 20+

### Runtime Errors
- Check deployment logs: Railway Dashboard → Deployments → Logs
- Verify environment variables are set correctly
- Test locally first: `npm run build && npm run start`

### Database Connection Issues
- Verify Supabase URL and keys in Railway variables
- Check Supabase project is running
- Ensure RLS policies are correctly set up

### Authentication Not Working
- Verify redirect URLs in Supabase Auth settings
- Check that cookies are enabled
- Ensure HTTPS is used (Railway provides it by default)

---

## 💰 Cost Estimation

**Railway Pricing (as of 2024):**
- **Hobby Plan:** $5/month for 500 hours
- **Pro Plan:** $20/month for unlimited hours + better resources

The Next.js admin panel typically uses:
- ~100-200 MB RAM
- Minimal CPU when idle
- Should run comfortably on Hobby plan for development

---

## 🎯 Production Checklist

Before going live:

- [ ] All Supabase migrations applied
- [ ] Seed data loaded (if needed)
- [ ] Environment variables configured
- [ ] Supabase redirect URLs added
- [ ] Test admin login: `admin@isin.ph` / `Admin123!`
- [ ] Test member approval flow
- [ ] Test contribution verification
- [ ] Custom domain configured (optional)
- [ ] Monitoring/alerts set up

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

---

## 🆘 Support

If you encounter issues:
1. Check Railway logs first
2. Review Supabase logs in Dashboard
3. Test locally: `cd admin && npm run build && npm run start`
4. Check Railway Community: https://help.railway.app
