# 🚀 Railway Quick Start - iSIN Admin Panel

Deploy your iSIN admin panel to Railway in 5 minutes!

---

## Prerequisites ✅

- [ ] GitHub account
- [ ] Railway account (free tier available)
- [ ] This repo pushed to GitHub
- [ ] Supabase project with migrations applied

---

## Step 1: Push to GitHub

```bash
cd d:\iSIN
git init
git add .
git commit -m "Initial commit: iSIN admin panel"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/isin.git
git push -u origin main
```

---

## Step 2: Deploy to Railway

### Option A: One-Click Deploy

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select `iSIN` repository
4. Railway auto-detects Next.js

### Option B: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd admin
railway init

# Deploy
railway up
```

---

## Step 3: Configure Service

In Railway Dashboard:

1. Click your service
2. Go to **Settings** → **Service**
3. Set **Root Directory:** `admin`
4. Click **Variables** tab

---

## Step 4: Add Environment Variables

Click **+ New Variable** and add:

```bash
# Node version
NODE_VERSION=20

# Supabase credentials (from Supabase Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 💡 **Tip:** Click **RAW Editor** to paste all at once

---

## Step 5: Configure Supabase Auth

After deployment completes:

1. Copy your Railway URL: `https://isin-admin-panel-production-xxxx.up.railway.app`
2. Go to Supabase Dashboard
3. Navigate to: **Authentication** → **URL Configuration**
4. Add these URLs:

**Site URL:**
```
https://your-railway-url.up.railway.app
```

**Redirect URLs:**
```
https://your-railway-url.up.railway.app/*
https://your-railway-url.up.railway.app/api/auth/callback
```

---

## Step 6: Test Your Deployment 🎉

1. Open your Railway URL
2. You should see the login page
3. Login with demo credentials:
   - Email: `admin@isin.ph`
   - Password: `Admin123!`

---

## 🎯 What's Next?

### Verify Everything Works:
- [ ] Login successful
- [ ] Dashboard loads with data
- [ ] Members page shows demo members
- [ ] Contributions page shows pending items
- [ ] All routes accessible

### Production Setup:
- [ ] Add custom domain (Railway Settings → Domains)
- [ ] Set up monitoring alerts
- [ ] Configure Railway variables from Supabase
- [ ] Test member approval flow
- [ ] Test contribution verification

---

## 🔧 Configuration Files Created

Your deployment includes:

1. **`railway.json`** - Build and deploy configuration
2. **`.railwayignore`** - Files to exclude from build
3. **`.env.railway.example`** - Environment variable template
4. **`RAILWAY_DEPLOYMENT.md`** - Complete deployment guide

---

## 📊 Expected Build Output

```
✓ Building with Nixpacks
✓ Installing dependencies (npm ci)
✓ Building Next.js app (npm run build)
✓ Creating production build
✓ Compiled 18 pages
✓ Starting server (npm run start)
✓ Deployed successfully
```

**Build time:** ~2-3 minutes  
**Memory usage:** ~150 MB  
**Start time:** ~5 seconds

---

## 🐛 Troubleshooting

### Build fails with "Cannot find module"
```bash
# Ensure package-lock.json is committed
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Environment variables not working
1. Check Railway Variables tab - ensure all are set
2. Redeploy: Railway Dashboard → Deployments → Redeploy

### 404 on all routes
1. Check Root Directory is set to `admin`
2. Verify `railway.json` is in `admin/` folder

### Supabase connection fails
1. Verify URL format: `https://xxxxx.supabase.co` (no trailing slash)
2. Check anon key and service role key are correct
3. Test Supabase project is active

---

## 💡 Pro Tips

1. **Auto-deploy on push:** Railway automatically deploys when you push to main
2. **Preview deployments:** Create PR for preview deployment
3. **Environment variables:** Use Railway's variable references: `${{Postgres.DATABASE_URL}}`
4. **Logs:** View real-time logs in Railway Dashboard
5. **Rollback:** Click previous deployment → Redeploy

---

## 📱 Deploy Mobile App Too?

Create a second service for the mobile web app:

1. Railway Dashboard → **New Service**
2. Same GitHub repo
3. Root Directory: `mobile`
4. Add start script to mobile/package.json:
   ```json
   "scripts": {
     "start:prod": "npx serve dist -p $PORT"
   }
   ```

---

## 🎓 Learn More

- [Railway Docs](https://docs.railway.app)
- [Next.js on Railway](https://docs.railway.app/guides/nextjs)
- [Supabase + Railway](https://supabase.com/docs/guides/hosting/railway)

---

## ✨ Success!

Your iSIN admin panel is now live on Railway! 🎉

Share your deployment URL with your team and start managing your Paluwagan operations.

**Deployed URL:** `https://your-service.up.railway.app`

---

## 🆘 Need Help?

- Check `RAILWAY_DEPLOYMENT.md` for detailed guide
- View Railway logs for errors
- Test locally first: `npm run build && npm run start`
- Railway Discord: https://discord.gg/railway
