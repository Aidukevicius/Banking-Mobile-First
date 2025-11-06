# Finance Tracker

A personal finance management application built with React, TypeScript, Express, and PostgreSQL. Track expenses, manage budgets, monitor investments, and gain insights into your spending habits with intelligent PDF bank statement parsing.

🚀 **[Live Demo](https://banking-mobile-first.onrender.com)**

## ✨ Features

- 💰 Transaction management with PDF bank statement import
- 📊 Budget tracking with custom categories
- 💵 Income and portfolio tracking
- 📈 Monthly analytics and spending insights
- 🔐 Secure authentication with password reset
- 💱 Multi-currency support (USD, EUR, GBP, JPY, CAD, AUD)
- 🎨 Dark mode support
- 📱 Mobile-first responsive design

## 🚀 Quick Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

### Prerequisites
- Render account (free tier available at [render.com](https://render.com))
- PostgreSQL database (create on Render)
- Brevo account for emails ([brevo.com](https://www.brevo.com))

### Deployment Steps

1. **Create PostgreSQL Database on Render**
   - Click "New +" → "PostgreSQL"
   - Choose a name and region
   - Copy the "Internal Database URL"

2. **Deploy Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Node Version:** 20.11.0

3. **Set Environment Variables**
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Generate with: `openssl rand -base64 32`
   - `BREVO_API_KEY` - From [Brevo Dashboard](https://app.brevo.com/settings/keys/api)
   - `FROM_EMAIL` - Your verified sender email
   - `FROM_NAME` - Display name (e.g., "Finance Tracker")
   - `BASE_URL` - Your app URL (e.g., `https://your-app.onrender.com`)

4. **Initialize Database**
   - In Render Dashboard, go to your web service
   - Click "Shell" tab
   - Run: `npm run db:push`

📖 **Detailed deployment guide:** See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query  
**Backend:** Express.js, PostgreSQL, Drizzle ORM, JWT Authentication  
**Email:** Brevo API  
**Hosting:** Render

## 💻 Local Development

### Quick Start

```bash
# Clone and install
git clone <your-repo-url>
cd finance-tracker
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/finance_tracker
JWT_SECRET=your-generated-jwt-secret-here
BREVO_API_KEY=your-brevo-api-key
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Finance Tracker
BASE_URL=http://localhost:5000
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📧 Email Setup (Brevo)

1. Sign up at [brevo.com](https://www.brevo.com)
2. Verify your sender email
3. Get API key from Settings → API Keys
4. Add to environment variables

## 🔑 Key API Endpoints

**Authentication**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

**Transactions**
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/upload-pdf` - Import PDF statement

**Categories**
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

**Portfolio**
- `GET /api/savings-pots` - List savings/investments
- `POST /api/savings-pots` - Create pot

## 🆘 Troubleshooting

**Database Connection**
- Ensure `DATABASE_URL` includes `?sslmode=require` for cloud databases
- Use Internal Database URL from Render

**Email Not Sending**
- Verify sender email in Brevo dashboard
- Check `BREVO_API_KEY` is correct
- Ensure `FROM_EMAIL` matches verified sender

**PDF Import Issues**
- Ensure file is valid PDF with text (not scanned images)
- Maximum file size is 10MB

---

Made with ❤️ for better financial management