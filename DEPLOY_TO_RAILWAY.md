# Deploy Finance Tracker to Railway

Railway is a great alternative to Vercel with **no timeout limits** and a free tier. Perfect for full-stack apps with database operations!

## Why Railway?

✅ **No timeout limits** (unlike Vercel's 10-second free tier limit)  
✅ **Free tier includes PostgreSQL database** (no need for separate Neon/Supabase)  
✅ **Simple deployment** from GitHub  
✅ **Automatic deployments** on every push  
✅ **Environment variables** managed in dashboard  

## Prerequisites

- [ ] GitHub account
- [ ] Railway account ([sign up free](https://railway.app))
- [ ] Brevo account for emails ([sign up free](https://brevo.com))

---

## Step 1: Prepare Your Code for Railway

Railway needs a couple of configuration files. Let's check if you have them:

### 1.1 Check `package.json` scripts

Your `package.json` should have these scripts (already configured in your project):

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && npm run build:server",
    "build:server": "esbuild server/routes.ts ... --outdir=dist/server",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### 1.2 Create `dist/index.js` for production

Railway will run `npm start` which expects a production entry file. Create this file:

**File: `dist/index.js`**
```javascript
// This file is created during the build process
// Railway uses this to start the production server
import { createApp } from '../server/app.js';

(async () => {
  const { server } = await createApp();
  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen({
    port,
    host: '0.0.0.0',
    reusePort: true,
  }, () => {
    console.log(`Server running on port ${port}`);
  });
})();
```

**Important**: We'll need to update the build script to create this file properly. I'll help you with that.

---

## Step 2: Push Code to GitHub

1. **Create a new repository on GitHub**: https://github.com/new
   - Name it: `finance-tracker` (or whatever you prefer)
   - Make it Public or Private (your choice)
   - Don't initialize with README (your code already has one)

2. **Push your code** (run these commands in your terminal):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
   git branch -M main
   git add .
   git commit -m "Initial commit for Railway deployment"
   git push -u origin main
   ```

---

## Step 3: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select your `finance-tracker` repository
5. Railway will detect it's a Node.js project automatically

---

## Step 4: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create a database and automatically add `DATABASE_URL` to your environment variables
4. **Important**: The database URL is automatically available to your app - no need to copy it!

---

## Step 5: Configure Environment Variables

1. In Railway project dashboard, click on your **service** (the one with your code)
2. Go to **"Variables"** tab
3. Add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `BREVO_API_KEY` | Your Brevo API key | From brevo.com dashboard |
| `FROM_EMAIL` | Your verified Brevo email | e.g., dom.aidukevicius@gmail.com |
| `FROM_NAME` | `Finance Tracker` | Display name for emails |
| `JWT_SECRET` | Generate new secret | Run: `openssl rand -hex 32` |
| `NODE_ENV` | `production` | Important for production build |
| `PORT` | `5000` | Railway auto-assigns but we use 5000 |

**Note**: `DATABASE_URL` is automatically set by Railway when you add the PostgreSQL database - you don't need to set it manually!

---

## Step 6: Configure Build Settings

Railway needs to know how to build and start your app.

1. In your service settings, go to **"Settings"** tab
2. Scroll to **"Build"** section
3. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

---

## Step 7: Initialize Database Schema

After the first deployment completes:

### Option A: Using Railway CLI (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and link project**:
   ```bash
   railway login
   railway link
   ```

3. **Push database schema**:
   ```bash
   railway run npm run db:push
   ```

### Option B: Using Postgres CLI in Railway

1. In Railway dashboard, click your **PostgreSQL database**
2. Go to **"Data"** tab
3. Click **"Query"** to open SQL editor
4. You'll need to manually run the schema SQL (not recommended - use CLI instead)

---

## Step 8: Get Your Deployment URL

1. In Railway dashboard, click your **service** (your app)
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** section
4. Click **"Generate Domain"**
5. Railway will give you a URL like: `https://your-app.up.railway.app`

---

## Step 9: Update BASE_URL

1. Copy your Railway deployment URL
2. Go back to **"Variables"** tab
3. Add new variable:
   - **Name**: `BASE_URL`
   - **Value**: Your Railway URL (e.g., `https://your-app.up.railway.app`)
4. Railway will automatically redeploy with the new variable

---

## Step 10: Test Your Deployment

1. Visit your Railway URL
2. Click **"Register"** and create an account
3. Try adding transactions, categories, etc.
4. **No more 504 timeouts!** 🎉

---

## Troubleshooting

### Build Failed

**Error**: `Cannot find module 'dist/index.js'`

**Solution**: Make sure your build script creates the production entry point. Update `package.json`:

```json
{
  "scripts": {
    "build": "vite build && npm run build:server && npm run build:entry",
    "build:server": "esbuild server/routes.ts server/storage.ts server/auth.ts server/pdf-parser.ts server/resend-client.ts server/rate-limiter.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server --external:@neondatabase/serverless --external:express --external:dotenv --external:ws --external:multer",
    "build:entry": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --external:express --external:dotenv"
  }
}
```

---

### Database Connection Failed

**Symptoms**: `DATABASE_URL must be set` error in logs

**Solution**: 
1. Make sure you added the PostgreSQL database to your Railway project
2. Railway automatically injects `DATABASE_URL` - don't manually set it
3. Restart the deployment: Settings → Redeploy

---

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**: Railway assigns a `PORT` environment variable. Update your server code to use it:

```javascript
const port = parseInt(process.env.PORT || '5000', 10);
```

(Your code already does this!)

---

### Email Not Sending

Same as Vercel troubleshooting:
- Verify your sender email in Brevo dashboard
- Check `BREVO_API_KEY` is correct
- Ensure `FROM_EMAIL` matches verified Brevo email

---

## Railway vs Vercel Comparison

| Feature | Railway | Vercel Free | Vercel Pro |
|---------|---------|-------------|------------|
| **Timeout** | No limit ⚡ | 10 seconds ⏱️ | 60 seconds |
| **Database** | Included (PostgreSQL) | Separate (Neon/Supabase) | Separate |
| **Price** | $5/month (free tier: $5 credit) | Free | $20/month |
| **Best for** | Full-stack apps with heavy backend | Static sites, light APIs | Production apps |
| **Build time** | ~2-3 minutes | ~1-2 minutes | ~1-2 minutes |

---

## Automatic Deployments

Every time you push to GitHub:
1. Railway detects the changes
2. Automatically rebuilds your app
3. Deploys the new version
4. Zero downtime! 🚀

---

## Custom Domain (Optional)

1. Railway dashboard → Your service → Settings
2. Scroll to "Networking" → "Custom Domains"
3. Click "Add Custom Domain"
4. Follow the DNS configuration instructions
5. Update `BASE_URL` environment variable to your custom domain

---

## Monitoring & Logs

### View Live Logs
1. Railway dashboard → Your service
2. Click **"Deployments"** tab
3. Click latest deployment
4. Logs stream in real-time

### Check Database Usage
1. Railway dashboard → PostgreSQL database
2. View **"Metrics"** tab
3. See CPU, RAM, Storage usage

---

## Cost Management

### Railway Pricing
- **Free tier**: $5 credit per month
- **Hobby plan**: $5/month + usage
- **Usage charges**:
  - PostgreSQL: ~$0.20-0.50/month (small app)
  - App service: ~$1-2/month (small traffic)

### Typical monthly cost for this app:
- **Low traffic**: ~$2-3/month (within $5 credit!)
- **Medium traffic**: ~$5-8/month

**Tip**: Railway gives you $5 free credit each month, which is usually enough for small personal projects!

---

## Migrate from Vercel to Railway

If you're currently on Vercel and want to switch:

### Keep Using Vercel for Frontend
You can deploy just the frontend to Vercel and backend to Railway:

1. **Frontend on Vercel**: Fast CDN, great for React apps
2. **Backend on Railway**: No timeouts, includes database

Update your frontend API calls to point to Railway:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://your-app.up.railway.app';
```

### Full Migration to Railway
Or just deploy everything to Railway (simpler):
1. Follow this guide
2. Update DNS to point to Railway
3. Delete Vercel deployment

---

## Getting Help

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **This app's issues**: [Your GitHub repo]/issues

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Create Railway project
3. ✅ Add PostgreSQL database
4. ✅ Set environment variables
5. ✅ Deploy and test
6. ✅ No more 504 timeouts!

**Ready to deploy?** Start with Step 2! 🚀
