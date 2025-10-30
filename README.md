# Finance Tracker

A comprehensive personal finance management application built with React, TypeScript, Express, and PostgreSQL. Track expenses, manage budgets, monitor investments, and gain insights into your spending habits with intelligent PDF bank statement parsing and automated transaction categorization.

## ✨ Features

- 💰 Transaction management with PDF bank statement import
- 📊 Budget tracking with custom categories
- 💵 Income and portfolio tracking
- 📈 Monthly analytics and spending insights
- 🔐 Secure authentication with password reset
- 💱 Multi-currency support (USD, EUR, GBP, JPY, CAD, AUD)
- 🎨 Dark mode support
- 📱 Mobile-first responsive design

## 🚀 Deploy to Vercel (Recommended)

This app is optimized for one-click deployment to Vercel directly from GitHub.

### Prerequisites
- GitHub account
- Vercel account (free tier works great)
- PostgreSQL database (we recommend [Neon](https://neon.tech) or [Supabase](https://supabase.com))
- Brevo account for email (get free API key at [Brevo](https://www.brevo.com))

### Step 1: Fork or Clone This Repo
Click the "Fork" button on GitHub, or clone directly:
```bash
git clone <your-repo-url>
cd finance-tracker
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration - just click "Deploy"
5. While deploying, add these environment variables:

### Step 3: Set Environment Variables in Vercel
In your Vercel project dashboard, go to Settings → Environment Variables and add:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Random secret for auth tokens | Generate: `openssl rand -hex 32` |
| `BREVO_API_KEY` | Brevo API key for emails | Get from [Brevo Dashboard](https://app.brevo.com/settings/keys/api) |
| `FROM_EMAIL` | Verified sender email | `noreply@yourapp.com` |
| `FROM_NAME` | Display name for emails | `Finance Tracker` |
| `BASE_URL` | Your deployed app URL | `https://yourapp.vercel.app` |

### Step 4: Initialize Database
After deployment, initialize your database schema:

1. Install Vercel CLI locally: `npm i -g vercel`
2. Link your project: `vercel link`
3. Run database push: `vercel env pull .env.local && npm run db:push`

That's it! Your app is now live at `https://yourapp.vercel.app` 🎉

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query  
**Backend:** Express.js, PostgreSQL, Drizzle ORM, JWT Authentication  
**Email:** Brevo API for transactional emails  
**Hosting:** Vercel (optimized for serverless deployment)

## 💻 Local Development

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database (local or cloud)
- Brevo account for password reset emails

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd finance-tracker
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/finance_tracker
JWT_SECRET=your-generated-jwt-secret-here
BREVO_API_KEY=your-brevo-api-key
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Finance Tracker
BASE_URL=http://localhost:5000
PORT=5000
NODE_ENV=development
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Initialize database:**
```bash
npm run db:push
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open your browser:**
```
http://localhost:5000
```

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🗄️ Database Setup

### Option 1: Neon (Recommended for Vercel)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables as `DATABASE_URL`

### Option 2: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use "Connection pooling" for serverless)
5. Add to Vercel environment variables as `DATABASE_URL`

### Option 3: Local PostgreSQL
```bash
# Install PostgreSQL
createdb finance_tracker
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://localhost:5432/finance_tracker
```

## 📧 Email Setup (Brevo)

1. Sign up at [brevo.com](https://www.brevo.com)
2. Verify your sender email
3. Go to Settings → API Keys
4. Create a new API key
5. Add to environment variables:
   - `BREVO_API_KEY`: Your API key
   - `FROM_EMAIL`: Your verified email
   - `FROM_NAME`: Display name (e.g., "Finance Tracker")

## 🔑 API Endpoints

All protected routes require `Authorization: Bearer <JWT_TOKEN>` header.

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/upload-pdf` - Import PDF statement

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Portfolio
- `GET /api/savings-pots` - List savings/investments
- `POST /api/savings-pots` - Create pot
- `PUT /api/savings-pots/:id` - Update pot
- `DELETE /api/savings-pots/:id` - Delete pot

### Settings
- `GET /api/settings` - Get user preferences
- `PUT /api/settings` - Update preferences

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 🆘 Troubleshooting

### Database Connection Issues
- Ensure your `DATABASE_URL` includes `?sslmode=require` for cloud databases
- For Neon, use the pooled connection string for serverless environments

### Email Not Sending
- Verify your sender email in Brevo dashboard
- Check that `BREVO_API_KEY` is correctly set
- Ensure `FROM_EMAIL` matches a verified sender

### Build Failures on Vercel
- Check that all environment variables are set
- Ensure Node.js version is 20.x in Vercel settings
- Review build logs in Vercel dashboard

### PDF Import Not Working
- Ensure uploaded file is a valid PDF
- Check that the PDF contains text (not scanned images)
- Maximum file size is 10MB

---

Made with ❤️ by the Finance Tracker Team
