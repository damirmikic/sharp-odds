# Sharp Odds - Railway + Vercel Deployment Guide

Complete step-by-step guide for deploying Sharp Odds using **Railway** (backend) and **Vercel** (frontend).

**Final Result:**
- Backend: `https://sharp-odds-api.up.railway.app`
- Frontend: `https://sharp-odds.vercel.app`
- ✅ Full SEO optimization
- ✅ HTTPS automatically
- ✅ Free tier available

---

## Prerequisites

- GitHub account
- Railway account (sign up at railway.app)
- Vercel account (sign up at vercel.com)
- Git installed locally
- Your API keys from The Odds API

---

## Part 1: Push Code to GitHub

### 1. Initialize Git Repository

```bash
cd "c:\Users\kvoter2\OneDrive - Pionir Internacional d.o.o\Radna površina\JS\Odds API Project\sharp-odds-app"

# Initialize git if not already done
git init

# Add gitignore for sensitive files
cat > .gitignore << EOF
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/
.vercel/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
EOF
```

### 2. Create GitHub Repository

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit - Sharp Odds application"

# Create repo on GitHub (https://github.com/new)
# Name it: sharp-odds-app

# Link and push
git remote add origin https://github.com/YOUR_USERNAME/sharp-odds-app.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend to Railway

### 1. Sign Up & Connect GitHub

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select **`sharp-odds-app`** repository

### 2. Configure Backend Service

1. Railway will detect your project structure
2. Click **"Add a Service"** → Select the repository
3. **Important:** Change the root directory:
   - Click on the service
   - Go to **Settings**
   - Under **"Build & Deploy"**
   - Set **Root Directory** to: `server`
   - Set **Start Command** to: `node index.js`

### 3. Add Environment Variables

In Railway project → **Variables** tab, add:

```bash
PORT=5000
ODDS_API_KEYS=your_key_1,your_key_2,your_key_3
NODE_ENV=production
```

**IMPORTANT:** Leave `FRONTEND_URL` empty for now (we'll add it after Vercel deployment).

### 4. Get Backend URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. You'll get: `https://sharp-odds-api.up.railway.app`
4. **Copy this URL** - you'll need it for Vercel!

### 5. Test Backend

```bash
# Test API endpoint
curl https://sharp-odds-api.up.railway.app/api/sports
```

If you get JSON response with leagues → Backend is working! ✅

---

## Part 3: Deploy Frontend to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy from Local Machine

```bash
cd "c:\Users\kvoter2\OneDrive - Pionir Internacional d.o.o\Radna površina\JS\Odds API Project\sharp-odds-app\client"

# Login to Vercel
vercel login

# Deploy
vercel
```

**Vercel will ask you questions:**

```
? Set up and deploy "~/sharp-odds-app/client"? [Y/n] Y
? Which scope do you want to deploy to? [Your Username]
? Link to existing project? [y/N] N
? What's your project's name? sharp-odds
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

### 3. Add Environment Variable

**CRITICAL STEP:**

```bash
# Add API URL as environment variable
vercel env add VITE_API_URL

# When prompted, enter:
https://sharp-odds-api.up.railway.app

# Select: Production, Preview, Development (all)
```

### 4. Deploy to Production

```bash
vercel --prod
```

You'll get: `https://sharp-odds.vercel.app` ✅

---

## Part 4: Update Railway Backend with Frontend URL

### 1. Add FRONTEND_URL to Railway

Go back to Railway:
1. Click on your backend service
2. Go to **Variables** tab
3. Add new variable:
   ```
   FRONTEND_URL=https://sharp-odds.vercel.app
   ```
4. Railway will automatically redeploy with CORS configured

---

## Part 5: Verify Deployment

### 1. Test Frontend

Visit: `https://sharp-odds.vercel.app`

You should see:
- ✅ Sharp Odds interface loads
- ✅ Leagues load in sidebar
- ✅ No CORS errors in console

### 2. Test SEO

**Check Meta Tags:**
```bash
curl -s https://sharp-odds.vercel.app | grep -i "og:title"
```

Should show: `Sharp Odds — Live Football Odds Comparison`

**Check Sitemap:**
Visit: `https://sharp-odds.vercel.app/sitemap.xml`

Should display XML sitemap with all URLs.

**Check Structured Data:**
Use: https://search.google.com/test/rich-results
- Enter: `https://sharp-odds.vercel.app`
- Should detect Organization schema ✅

---

## Part 6: Submit to Google Search Console

### 1. Verify Ownership

1. Go to https://search.google.com/search-console
2. Click **"Add Property"**
3. Select **"URL prefix"**
4. Enter: `https://sharp-odds.vercel.app`

### 2. Verify via HTML Tag

Vercel makes this easy:
1. Google will give you a meta tag like:
   ```html
   <meta name="google-site-verification" content="YOUR_CODE" />
   ```
2. Add it to `client/index.html` in the `<head>` section
3. Commit and push to GitHub
4. Vercel auto-deploys
5. Click **"Verify"** in Google Search Console

### 3. Submit Sitemap

In Google Search Console:
1. Go to **"Sitemaps"** (left sidebar)
2. Enter: `sitemap.xml`
3. Click **"Submit"**

Google will start crawling! 🎉

---

## Part 7: Optional - Custom Domain (Later)

When you buy a domain, it's easy to migrate:

### On Vercel:

1. Go to Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `sharp-odds.com`
4. Follow DNS instructions

### Update Environment:

Just change URLs in environment variables:
- Railway: `FRONTEND_URL=https://sharp-odds.com`
- Vercel: `VITE_API_URL=https://api.sharp-odds.com`

No code changes needed!

---

## Environment Variables Summary

### Railway (Backend)
```bash
PORT=5000
FRONTEND_URL=https://sharp-odds.vercel.app
ODDS_API_KEYS=key1,key2,key3
NODE_ENV=production
```

### Vercel (Frontend)
```bash
VITE_API_URL=https://sharp-odds-api.up.railway.app
```

---

## Troubleshooting

### ❌ CORS Errors

**Problem:** "CORS policy blocked"

**Solution:**
1. Check Railway `FRONTEND_URL` is correct
2. Ensure it matches your Vercel URL exactly (no trailing slash)
3. Redeploy Railway backend

### ❌ API Not Loading

**Problem:** Frontend can't connect to backend

**Solution:**
1. Check Vercel environment variable `VITE_API_URL`
2. Rebuild frontend: `vercel --prod`
3. Test backend directly: `curl https://your-railway-url.up.railway.app/api/sports`

### ❌ Build Fails on Vercel

**Problem:** `npm run build` fails

**Solution:**
```bash
# Test locally first
cd client
npm install
npm run build

# Fix any errors, then:
git add .
git commit -m "Fix build errors"
git push

# Vercel auto-redeploys
```

### ❌ Empty/White Page

**Problem:** Vercel shows blank page

**Solution:**
1. Check browser console for errors
2. Verify `VITE_API_URL` is set in Vercel
3. Check Vercel deployment logs
4. Ensure `dist` folder was created in build

---

## Cost Breakdown

### Railway Free Tier:
- ✅ $5/month credit
- ✅ Enough for backend API
- ✅ Auto-sleep after inactivity (wakes on request)

### Vercel Free Tier:
- ✅ Unlimited frontend hosting
- ✅ 100GB bandwidth/month
- ✅ Auto HTTPS
- ✅ Global CDN

**Total Cost: $0/month** (within free tier limits) 🎉

---

## Monitoring & Logs

### View Railway Logs:
```bash
# Real-time logs
railway logs

# Or in Railway dashboard → Deployments → View Logs
```

### View Vercel Logs:
```bash
vercel logs

# Or in Vercel dashboard → Deployments → [Latest] → Logs
```

---

## Updating Your App

### Quick Updates:

```bash
# Make code changes
git add .
git commit -m "Update feature X"
git push

# Both Railway and Vercel auto-deploy! 🚀
```

### Manual Redeploy:

**Railway:** Click "Redeploy" in dashboard
**Vercel:** Run `vercel --prod` in client folder

---

## SEO Checklist ✅

After deployment, verify:

- [x] Meta tags show in page source
- [x] Open Graph tags have full URLs (https://sharp-odds.vercel.app/sharp-logo.png)
- [x] Sitemap accessible at /sitemap.xml
- [x] Robots.txt allows crawling
- [x] Google Search Console verified
- [x] Sitemap submitted to Google
- [x] Rich Results test passes (Schema.org data)
- [x] Page loads with HTTPS (automatic on Vercel)

---

## Next Steps After Deployment

1. **Monitor Google Search Console** - Check for crawl errors
2. **Share on Social Media** - Test Open Graph cards
3. **Add Google Analytics** - Track visitors
4. **Monitor API Quota** - Check Railway logs for usage
5. **Get Domain** - When ready, add custom domain

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **The Odds API:** https://the-odds-api.com/account/

---

**Deployment Time:** ~15-20 minutes
**Difficulty:** Easy
**Maintenance:** Automatic updates via Git push

🎉 **Your Sharp Odds app is now live and SEO-optimized!**
