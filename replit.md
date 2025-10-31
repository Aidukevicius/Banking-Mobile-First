# Finance Tracker

This is a comprehensive finance tracking application. For full documentation, see:

- **README.md** - Quick start, features, API endpoints, deployment guide
- **DEVELOPMENT.md** - Complete development guide, architecture, implementation details
- **TESTING_CHECKLIST.md** - Comprehensive testing checklist with 150+ test cases
- **TEST_RESULTS.md** - Latest test results and bug fixes (October 30, 2025)

## Quick Links

### Getting Started
1. Copy `.env.example` to `.env` and fill in your credentials
2. Run `npm install` to install dependencies
3. Run `npm run db:push` to initialize the database
4. Run `npm run dev` to start development server
5. Open `http://localhost:5000`

### Key Features
- Transaction management with PDF import
- Smart auto-categorization learning system
- Budget tracking and categories
- Income and portfolio tracking
- Multi-currency support
- Dark mode
- Email-based password reset
- Mobile-first responsive design

### Tech Stack
- Frontend: React 18 + TypeScript + Tailwind + Shadcn UI
- Backend: Express + PostgreSQL + Drizzle ORM
- Email: Brevo API
- Auth: JWT + bcrypt
- Deployment: Optimized for Vercel (works with any Node.js host)

### Deployment
This app can be deployed to **Vercel or Railway**:

**Railway (Recommended for most users):**
- ✅ No timeout limits (unlike Vercel free tier's 10-second limit)
- ✅ Includes PostgreSQL database (no separate setup needed)
- ✅ Free tier with $5 monthly credit (enough for small apps)
- See **DEPLOY_TO_RAILWAY.md** for step-by-step guide

**Vercel (For Pro plan users):**
- ⚠️ Free tier has 10-second timeout (causes 504 errors)
- ✅ Pro plan ($20/month) has 60-second timeout
- Requires separate database (Neon/Supabase)
- See **DEPLOY_TO_VERCEL.md** for step-by-step guide

**Which to choose?**
- See **DEPLOYMENT_GUIDE.md** for detailed comparison
- **TL;DR**: Use Railway unless you specifically need Vercel

### Recent Updates (October 30, 2025)
- **CRITICAL FIX**: PDF parser creating duplicate transactions (9 from 5-transaction PDF)
  - Changed from combining all 11 parsers to sequential fallback approach
  - Now properly filters headers and deduplicates before accepting results
  - Architect-reviewed and approved
- **FIXED**: Logout 404 error - now redirects to home page
- **FIXED**: Duplicate transaction detection on second PDF upload
- **ADDED**: Starting amount checkbox for portfolio pots (doesn't count toward monthly investment)
- **COMPLETED**: Comprehensive code review of all 150+ test cases

See the full documentation files for complete details on architecture, development workflow, deployment, and testing.
