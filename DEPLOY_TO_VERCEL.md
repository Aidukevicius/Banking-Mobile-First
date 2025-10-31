# Quick Deploy to Vercel Guide

This guide will help you deploy the Finance Tracker app to Vercel in under 10 minutes.

## Prerequisites Checklist
- [ ] GitHub account
- [ ] Vercel account ([sign up free](https://vercel.com))
- [ ] PostgreSQL database (Neon or Supabase recommended)
- [ ] Brevo account for emails ([sign up free](https://www.brevo.com))

## Step 1: Prepare Your Database

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) and sign up
2. Click "Create Project"
3. Copy your connection string (it looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. Save it - you'll need it in Step 4

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings → Database → Connection String
4. Choose "Connection pooling" for better performance
5. Copy the connection string
6. Save it - you'll need it in Step 4

## Step 2: Get Brevo API Key
1. Sign up at [brevo.com](https://www.brevo.com)
2. Verify your email address (this becomes your sender email)
3. Go to Settings → SMTP & API → API Keys
4. Click "Create a new API key"
5. Name it "Finance Tracker"
6. Copy the key - you'll need it in Step 4

## Step 3: Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select this repository from GitHub
4. Vercel will auto-detect settings - **DON'T click Deploy yet!**

## Step 4: Add Environment Variables
Before deploying, click "Environment Variables" and add these:

| Name | Value | Where to Get It |
|------|-------|-----------------|
| `DATABASE_URL` | Your PostgreSQL connection string | From Step 1 (Neon or Supabase) |
| `JWT_SECRET` | Random 64-character string | Run: `openssl rand -hex 32` |
| `BREVO_API_KEY` | Your Brevo API key | From Step 2 |
| `FROM_EMAIL` | Your verified email | The email you verified in Brevo |
| `FROM_NAME` | `Finance Tracker` | Just type this |
| `BASE_URL` | Your Vercel deployment URL | See Step 6 below |

**Pro tip:** Generate JWT_SECRET by running this in your terminal:
```bash
openssl rand -hex 32
```

**Important:** You can leave `BASE_URL` empty for now and add it after deployment (see Step 6).

## Step 5: Deploy!
1. Click "Deploy" button
2. Wait 2-3 minutes while Vercel builds your app
3. You'll see "🎉 Congratulations!" when done

## Step 6: Update BASE_URL
1. Copy your deployment URL (e.g., `https://finance-tracker-abc123.vercel.app`)
2. Go to your Vercel project → Settings → Environment Variables
3. Add or update `BASE_URL` with your deployment URL
4. Click "Save"
5. Go to Deployments tab
6. Click "..." on the latest deployment → "Redeploy"

## Step 7: Initialize Database
You need to push the database schema. Two options:

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Push database schema
npm run db:push
```

### Option B: Using SQL directly
1. Go to your database dashboard (Neon or Supabase)
2. Open the SQL editor
3. Run the migration SQL from `shared/schema.ts`

## Step 8: Test Your App
1. Visit your Vercel URL
2. Click "Register" and create an account
3. Check your email for the welcome message (if configured)
4. Start adding transactions!

## Troubleshooting

### "504 Gateway Timeout" errors
**This is the most common Vercel deployment issue!**

**Root cause:** Vercel has strict serverless function timeout limits:
- **Free/Hobby tier**: 10 seconds max (cannot be changed)
- **Pro tier**: 15-60 seconds (configurable, already set to 60s in vercel.json)
- **Enterprise tier**: Up to 15 minutes

**Solutions:**

1. **Upgrade to Vercel Pro** (Recommended for production)
   - Go to your Vercel dashboard → Settings → Plans
   - Upgrade to Pro plan ($20/month)
   - This gives you 60 second timeout (already configured in vercel.json)

2. **Optimize Database Connections**
   - Use connection pooling (highly recommended for serverless)
   - For Neon: Use the "Pooled connection" string instead of direct connection
   - For Supabase: Enable "Connection pooling" in Settings → Database
   - Example pooled URL: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname`

3. **Match Database Region to Vercel Function Region**
   - Deploy to same region as your database to reduce latency
   - In vercel.json, you can add regions:
   ```json
   "functions": {
     "api/index.ts": {
       "memory": 1024,
       "maxDuration": 60,
       "regions": ["iad1"]
     }
   }
   ```
   - Common regions: `iad1` (US East), `sfo1` (US West), `fra1` (Europe)

4. **Deploy Backend Separately (Free Alternative)**
   If you want to stay on free tier, deploy your backend to a platform without timeouts:
   - **Railway.app** - Free tier, deploy the full Express app
   - **Render.com** - Free tier with 15 minute timeout
   - **Fly.io** - Free tier available
   
   Then update your frontend to call the separate backend URL.

**Debug timeout issues:**
1. Go to Vercel project → Deployments → Latest deployment
2. Click "Functions" tab
3. Look for "FUNCTION_INVOCATION_TIMEOUT" errors
4. Check which endpoint is timing out
5. Review that endpoint's database queries and optimize them

### "500 Internal Server Error" on API calls
**Common causes:**
1. **Missing environment variables** - Check that ALL variables from Step 4 are set in Vercel
2. **Database connection failed** - Verify `DATABASE_URL` is correct and database is accessible
3. **Database schema not initialized** - Run `npm run db:push` (see Step 7)

**How to debug:**
1. Go to Vercel project → Deployments → Click latest deployment
2. Click "Functions" tab to see serverless function logs
3. Look for specific error messages
4. Common fixes:
   - Add missing environment variables
   - Ensure `DATABASE_URL` ends with `?sslmode=require`
   - Verify database schema is pushed

### "Database connection failed"
- Check that `DATABASE_URL` ends with `?sslmode=require`
- Verify your database is running (check Neon/Supabase dashboard)
- Make sure you didn't include extra spaces in the connection string
- For Neon: Use the "Pooled connection" string (better for serverless)
- For Supabase: Use "Connection pooling" mode

### "Email not sending"
- Verify your sender email in Brevo dashboard
- Check that `BREVO_API_KEY` is correct
- Ensure `FROM_EMAIL` matches your verified Brevo email
- Check Brevo dashboard for email sending logs

### "Build failed"
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Try redeploying from the Deployments tab
- Verify `package.json` scripts are correct

### "Cannot find module @rollup/rollup-linux-x64-gnu"
**This has been fixed in the latest version!** The app now uses Rollup's WASM version which works on all serverless platforms.

If you still see this error:
1. Make sure your `package.json` includes this override:
   ```json
   "overrides": {
     "rollup": "npm:@rollup/wasm-node"
   }
   ```
2. Delete `package-lock.json` and `node_modules`
3. Run `npm install` locally
4. Commit the new `package-lock.json`
5. Push to trigger a fresh Vercel deployment

### "DOMMatrix is not defined" or PDF parsing errors
**This has been fixed in the latest version!** The app now uses `unpdf` instead of `pdf-parse`, which is fully compatible with serverless environments like Vercel.

If you see PDF-related errors:
1. Verify you're using the latest code (check `package.json` for `unpdf` dependency)
2. The old `pdf-parse` package required canvas/DOM APIs not available on Vercel
3. The new `unpdf` package works perfectly on all serverless platforms

### "Page not found" or 404 errors
- Verify the build completed successfully
- Check that `outputDirectory` is set to `dist/public` in vercel.json
- Ensure frontend build succeeded (check build logs)
- Try a fresh redeploy

### "Cannot read property of undefined" errors
- Usually means environment variables are missing
- Go to Settings → Environment Variables
- Verify all required variables are present
- Redeploy after adding missing variables

## View Logs & Debug
To see what's happening on Vercel:
1. Go to your Vercel project dashboard
2. Click "Deployments" tab
3. Click on the latest deployment
4. Click "Functions" to see API logs
5. Click "Build Logs" to see build output

## Custom Domain (Optional)
1. Go to your Vercel project → Settings → Domains
2. Add your domain (e.g., `myfinanceapp.com`)
3. Follow Vercel's DNS instructions
4. Update `BASE_URL` environment variable to your custom domain
5. Redeploy

## Updating Your App
Whenever you push to GitHub, Vercel automatically:
1. Detects the change
2. Builds the new version
3. Deploys it to production
4. Zero downtime!

---

**Still having issues?** Check the main README.md for detailed documentation and API reference, or check Vercel's function logs for specific error messages.
