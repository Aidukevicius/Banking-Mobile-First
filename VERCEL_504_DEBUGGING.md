# Vercel 504 Timeout Debugging Guide

You're experiencing 504 timeouts on Vercel. This guide will help you identify and fix the exact cause.

## Step 1: Identify Which Endpoint is Timing Out

### Method 1: Browser DevTools (Easiest)
1. Open your deployed Vercel app
2. Press F12 (or Cmd+Option+I on Mac) to open DevTools
3. Go to the **Network** tab
4. Try to use your app (register, login, etc.)
5. Look for any request with:
   - Status: `504` (red)
   - Time: ~10 seconds (or ~60 seconds if on Pro plan)

**Which endpoint shows 504?** (examples: `/api/auth/register`, `/api/auth/login`, `/api/transactions`)

### Method 2: Vercel Dashboard Logs
1. Go to: https://vercel.com/your-username/your-project-name
2. Click **Deployments** → Click your latest deployment
3. Click **Functions** tab
4. Look for errors like:
   ```
   FUNCTION_INVOCATION_TIMEOUT
   Task timed out after 10.01 seconds
   ```

**Screenshot the error and note which function timed out**

---

## Step 2: Check Your Vercel Plan

### What plan are you on?
Go to: https://vercel.com/your-username/settings

- **Hobby (Free)**: 10-second timeout limit (cannot be changed)
- **Pro ($20/month)**: 60-second timeout (already configured in vercel.json)

**⚠️ If you're on Free tier:**
- The 10-second limit is HARD and cannot be increased
- Database operations often take 5-15 seconds on first request (cold start)
- **Solution**: Either upgrade to Pro OR deploy backend to Railway/Render instead

---

## Step 3: Check Your Database Connection String

This is the **#1 cause of timeouts on Vercel**.

### For Neon Database:

1. Go to your Neon dashboard: https://console.neon.tech
2. Click your project → **Connection Details**
3. **CRITICAL**: Make sure you're using the **"Pooled connection"** string

**Wrong (Direct connection - SLOW on serverless):**
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname
```

**Correct (Pooled connection - FAST on serverless):**
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname
```

Notice the `-pooler` in the hostname!

4. Copy the **pooled connection** string
5. Go to Vercel → Your Project → Settings → Environment Variables
6. Update `DATABASE_URL` with the pooled connection string
7. Click "Redeploy" from Deployments tab

### For Supabase:

1. Go to your Supabase dashboard → Project Settings → Database
2. Under "Connection string", switch to **"Connection pooling"** mode
3. Choose **Transaction** mode (recommended for serverless)
4. Copy the connection string
5. Update `DATABASE_URL` in Vercel environment variables
6. Redeploy

---

## Step 4: Match Database and Function Regions

High latency between your Vercel function and database causes timeouts.

### Check Your Database Region:
- **Neon**: Dashboard shows region (e.g., `us-east-1`, `us-west-2`)
- **Supabase**: Dashboard → Project Settings → General

### Check Your Vercel Function Region:
1. Vercel Dashboard → Your Project → Settings → Functions
2. Look for "Region" setting

### Fix Region Mismatch:

**Option A**: Move database to match Vercel (recommended)
- Neon: Create new project in correct region, migrate data
- Supabase: Create new project in correct region

**Option B**: Specify Vercel function region in `vercel.json`:
```json
{
  "functions": {
    "api/index.ts": {
      "memory": 1024,
      "maxDuration": 60,
      "regions": ["iad1"]
    }
  }
}
```

Common regions:
- `iad1` - US East (Virginia)
- `sfo1` - US West (San Francisco)
- `fra1` - Europe (Frankfurt)
- `sin1` - Asia (Singapore)

---

## Step 5: View Function Logs with Timing

I've added timing logs to your code. After redeploying, you can see exactly where the timeout happens:

1. Deploy to Vercel
2. Try to register/login
3. Go to Vercel → Deployments → Latest → Functions
4. Look for logs like:
   ```
   [REGISTER] Start
   [REGISTER] Parsed input: 5 ms
   [REGISTER] Checking username...
   [REGISTER] Username check done: 8542 ms  ← TIMEOUT HERE!
   ```

This shows the database query took 8.5 seconds!

---

## Common Timeout Scenarios & Solutions

### Scenario 1: Free Tier + Database Connection Timeout
**Symptoms:**
- First API call takes 10+ seconds
- Works fine on subsequent requests
- Vercel plan: Hobby/Free

**Root cause:** Database connection + query takes >10 seconds on cold start

**Solutions (pick one):**
1. ✅ **Upgrade to Vercel Pro** ($20/month) - Simplest
2. ✅ **Use pooled connection string** (see Step 3) - Required
3. ✅ **Deploy backend separately**:
   - Frontend: Keep on Vercel
   - Backend: Deploy to Railway.app (free tier, no timeout limits)
   - Guide: See `DEPLOY_TO_RAILWAY.md` (I can create this if needed)

### Scenario 2: Database in Wrong Region
**Symptoms:**
- EVERY request takes 3-8 seconds
- Even simple queries timeout
- Works fine locally

**Root cause:** Database is in Asia, Vercel function is in US East (or vice versa)

**Solution:** Match regions (see Step 4)

### Scenario 3: PDF Upload Timeout
**Symptoms:**
- `/api/transactions/upload-pdf` times out
- Other endpoints work fine

**Root cause:** PDF parsing takes >10 seconds on large files

**Solutions:**
1. Upgrade to Pro (60s timeout)
2. OR limit PDF file size to 1MB
3. OR deploy backend separately (Railway/Render)

---

## Quick Fixes Checklist

Try these in order:

- [ ] **Step 1**: Use POOLED database connection (see Step 3)
- [ ] **Step 2**: Match database and function regions (see Step 4)
- [ ] **Step 3**: Upgrade to Vercel Pro OR deploy to Railway instead
- [ ] **Step 4**: Check Vercel function logs to see exact timeout location
- [ ] **Step 5**: Consider splitting: Frontend on Vercel + Backend on Railway

---

## Alternative: Deploy Backend to Railway (Free, No Timeouts)

If you want to stay on Vercel's free tier for the frontend but need longer timeouts for the backend:

1. Deploy backend to Railway.app:
   - Railway has free tier
   - No timeout limits
   - Full PostgreSQL database included

2. Keep frontend on Vercel (free tier is fine for frontend)

3. Update frontend to call Railway backend URL

**Would you like me to create a guide for this setup?**

---

## Next Steps

**Please tell me:**
1. Which Vercel plan are you on? (Free or Pro)
2. Which endpoint is timing out? (check Step 1)
3. Are you using a POOLED database connection? (check Step 3)
4. What region is your database in?

With this info, I can give you the exact fix for your situation.
