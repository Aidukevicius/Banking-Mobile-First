# Finance Tracker

A comprehensive personal finance management application built with React, TypeScript, Express, and PostgreSQL. Track expenses, manage budgets, monitor investments, and gain insights into your spending habits with intelligent PDF bank statement parsing and automated transaction categorization.

## Features

- 💰 Transaction management with PDF bank statement import
- 📊 Budget tracking with custom categories
- 💵 Income and portfolio tracking
- 📈 Monthly analytics and spending insights
- 🔐 Secure authentication with password reset
- 💱 Multi-currency support (USD, EUR, GBP, JPY, CAD, AUD)
- 🎨 Dark mode support
- 📱 Mobile-first responsive design

## Tech Stack

**Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query
**Backend:** Express.js, PostgreSQL, Drizzle ORM, JWT Authentication
**Email:** Brevo API for transactional emails

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database
- Brevo account for password reset emails

### Installation

1. Clone and install:
```bash
git clone <your-repo-url>
cd finance-tracker
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `BREVO_API_KEY` - From https://app.brevo.com/settings/keys/api
- `FROM_EMAIL` - Verified sender email in Brevo
- `FROM_NAME` - Display name for emails
- `BASE_URL` - Your application URL (e.g., `https://yourapp.com`)

3. Initialize database:
```bash
npm run db:push
```

4. Start development:
```bash
npm run dev
```

5. Open `http://localhost:5000`

## Production Deployment

### Build
```bash
npm run build
npm start
```

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

## API Endpoints

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

## License

MIT