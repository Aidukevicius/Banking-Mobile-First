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
| `BASE_URL` | Leave empty for now | We'll add this in Step 6 |

**Pro tip:** Generate JWT_SECRET by running this in your terminal:
```bash
openssl rand -hex 32
```

## Step 5: Deploy!
1. Click "Deploy" button
2. Wait 2-3 minutes while Vercel builds your app
3. You'll see "🎉 Congratulations!" when done

## Step 6: Update BASE_URL
1. Copy your deployment URL (e.g., `https://finance-tracker-abc123.vercel.app`)
2. Go to your Vercel project → Settings → Environment Variables
3. Find `BASE_URL` and set it to your deployment URL
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

### "Database connection failed"
- Check that `DATABASE_URL` ends with `?sslmode=require`
- Verify your database is running (check Neon/Supabase dashboard)
- Make sure you didn't include extra spaces in the connection string

### "Email not sending"
- Verify your sender email in Brevo dashboard
- Check that `BREVO_API_KEY` is correct
- Ensure `FROM_EMAIL` matches your verified Brevo email

### "Build failed"
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Try redeploying from the Deployments tab

### "Page not found" or 404 errors
- Check that the build completed successfully
- Verify `outputDirectory` is set to `dist/public` in vercel.json
- Redeploy from scratch if needed

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

**Need help?** Check the main README.md for detailed documentation and API reference.
