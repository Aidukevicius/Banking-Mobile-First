
# Deployment Guide

## Recommended: Replit Deployment (Primary)

Your application is optimized for Replit Deployments with zero additional configuration needed.

### Prerequisites
1. Ensure all environment variables are set in Replit Secrets:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `BREVO_API_KEY` - From https://app.brevo.com/settings/keys/api
   - `FROM_EMAIL` - dom.aidukevicius@gmail.com
   - `FROM_NAME` - Finance Tracker
   - `BASE_URL` - Will be your deployment URL (e.g., `https://yourapp.replit.app`)

### Deploy Steps
1. Click "Deploy" button in top right of workspace
2. Select "Reserved VM" deployment type
3. Configure settings:
   - **Machine Size**: Select based on expected traffic (0.5 vCPU recommended for start)
   - **Build Command**: `npm run build` (already configured)
   - **Run Command**: `npm run start` (already configured)
   - **Port**: 5000 (already mapped to 80/443)
4. Click "Deploy"
5. After deployment, update `BASE_URL` secret with your actual deployment URL

### Post-Deployment
- Your app will be live at `https://yourapp.replit.app`
- Automatic HTTPS is enabled
- Database migrations run automatically on startup
- Monitor logs in the Deployments tab

### Benefits
- Zero configuration needed (already set up in .replit)
- Integrated secrets management
- Automatic HTTPS and SSL certificates
- Built-in database support
- Autoscaling available
- Direct deployment from your workspace

---

## Reference: Vercel Deployment Configuration

⚠️ **Note**: This is reference documentation only. Replit Deployment is recommended for this project.

### Prerequisites
1. Vercel account
2. PostgreSQL database (external provider like Neon, Supabase, or Railway)
3. Install Vercel CLI: `npm i -g vercel`

### Project Configuration

#### 1. Create `vercel.json` in project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 2. Update package.json scripts for Vercel:
```json
{
  "scripts": {
    "vercel-build": "npm run build"
  }
}
```

#### 3. Environment Variables in Vercel Dashboard
Go to Project Settings → Environment Variables and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your PostgreSQL URL | From Neon/Supabase/Railway |
| `JWT_SECRET` | Generated secret | Use crypto to generate |
| `BREVO_API_KEY` | Your Brevo key | From Brevo dashboard |
| `FROM_EMAIL` | dom.aidukevicius@gmail.com | Verified in Brevo |
| `FROM_NAME` | Finance Tracker | Display name |
| `BASE_URL` | https://yourapp.vercel.app | Your Vercel domain |
| `PORT` | 5000 | Optional on Vercel |
| `NODE_ENV` | production | Set automatically |

#### 4. Deploy Commands
```bash
# Login to Vercel
vercel login

# Initial deployment (interactive)
vercel

# Production deployment
vercel --prod
```

### Vercel Dashboard Configuration
1. **Build Settings**:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

2. **Root Directory**: Leave empty (use project root)

3. **Node.js Version**: 20.x (match your development environment)

### Database Considerations for Vercel
Vercel uses serverless functions, which may cause connection pooling issues with PostgreSQL. Consider:

1. **Use Neon**: Serverless Postgres optimized for serverless deployments
2. **Connection Pooling**: Enable PgBouncer in your database provider
3. **Update DATABASE_URL**: Use connection pooling URL if available

### Post-Deployment on Vercel
1. Run migrations manually or via Vercel Deploy Hook
2. Set up custom domain in Vercel Dashboard
3. Monitor logs in Vercel Dashboard
4. Configure CORS if needed for custom domains

### Known Limitations on Vercel
- 10-second execution timeout on Hobby plan
- Stateless functions (no persistent connections)
- Cold starts may affect first request
- May require additional configuration for WebSocket support

---

## Comparison

| Feature | Replit Deployment | Vercel |
|---------|-------------------|---------|
| Configuration | Zero-config ✅ | Manual setup needed |
| Database | Built-in support ✅ | External required |
| Secrets | Integrated UI ✅ | Dashboard or CLI |
| Build Time | Fast ✅ | Fast ✅ |
| Cost | Usage-based | Free tier + usage |
| Debugging | Integrated logs ✅ | Dashboard logs |
| Websockets | Native support ✅ | Requires config |
| Persistent Storage | Yes ✅ | Limited |

## Recommendation

**Use Replit Deployment** because:
1. Your project is already fully configured for it
2. No additional setup needed
3. Integrated development and deployment workflow
4. Better support for full-stack applications with websockets
5. Direct database integration
6. Simpler secrets management

The Vercel configuration above is provided as reference only for understanding alternative deployment options.
