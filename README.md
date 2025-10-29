# Finance Tracker

A comprehensive full-stack personal finance management application built with React, TypeScript, Express, and PostgreSQL. Track expenses, manage budgets, monitor investments, and gain insights into your spending habits with intelligent PDF bank statement parsing and automated transaction categorization.

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database (local or hosted like Neon, Supabase, etc.)
- Brevo account for sending password reset emails ([Sign up free](https://www.brevo.com/))

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual credentials in `.env`:
   - **BREVO_API_KEY**: Your Brevo API key from [https://app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
   - **FROM_EMAIL**: Email address for outgoing emails (must be verified in Brevo)
   - **FROM_NAME**: Display name for emails (e.g., "Finance Tracker")
   - **DATABASE_URL**: PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
   - **JWT_SECRET**: Generate securely with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - **BASE_URL**: Your application URL for email links (e.g., `http://localhost:5000` for local development)
   - **PORT**: Server port (default: 5000)
   - **NODE_ENV**: Environment (development/production)

3. **Never commit the `.env` file to version control!**

## Features

### 💰 Transaction Management
- **Manual Entry**: Add transactions with date, description, provider, amount, and category
- **PDF Import**: Upload bank statement PDFs to automatically extract and import transactions (using regex-based parsing)
- **Smart Categorization**: Machine learning system that remembers provider-to-category mappings
- **Auto-Categorization**: Future transactions from known providers are automatically categorized
- **Bulk Operations**: Edit multiple transactions and clear all transactions with confirmation dialogs
- **Search & Filter**: Real-time search across descriptions and providers

### 📊 Budget & Category Management
- **Custom Categories**: Create unlimited income and expense categories with custom icons and colors
- **Budget Limits**: Set monthly budget limits for each category
- **Visual Tracking**: See spending vs. budget with progress indicators
- **Category Learning**: System learns and remembers provider-to-category mappings

### 💵 Income Tracking
- **Dedicated Income Tab**: Separate page for managing all income sources
- **Income Categories**: Built-in categories for Salary, Freelance, Investment Returns, and Other Income
- **Monthly Totals**: Automatic calculation of total monthly income from all sources
- **Income Breakdown**: Visual breakdown showing income by category
- **Recent Transactions**: Quick view of recent income entries

### 📈 Portfolio Tracking
- **Savings Tracker**: Monitor your savings account balance month by month
- **Investment Portfolio**: Track investment values and performance
- **Quick Adjustments**: Add or subtract amounts with one click
- **Historical Data**: View past months' portfolio values
- **Total Portfolio Value**: See combined savings and investments at a glance

### 📱 Dashboard & Analytics
- **Monthly Overview**: Current month's income, expenses, and net balance
- **Expense Breakdown**: Visual charts showing spending by category
- **Top Categories**: Identify your biggest expense categories
- **Month Selector**: Navigate through different months to view historical data
- **Real-time Updates**: Automatic recalculation of totals when transactions change

### ⚙️ Settings & Customization
- **Currency Selection**: Choose from USD, EUR, GBP, JPY, CAD, AUD
- **Theme Options**: Light and dark mode support
- **User Preferences**: Personalized settings saved per user account

### 🔐 Authentication & Security
- **User Accounts**: Secure registration and login with username/password
- **Password Hashing**: Industry-standard bcrypt password encryption (salt rounds: 10)
- **Session Management**: JWT token-based authentication
- **Password Reset**: Email-based password reset with secure tokens (SHA-256 hashed, 1-hour expiration)
- **Email Integration**: Transactional emails via Brevo API
- **Data Isolation**: Each user's data is completely separate and private
- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, and numbers

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for server state management
- **Shadcn/ui** component library
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Framer Motion** for animations

### Backend
- **Express.js** server
- **PostgreSQL** database with Neon
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **Multer** for file uploads
- **PDF-Parse** for PDF processing

### Development Tools
- **Vite** for fast development and building
- **TypeScript** for type safety
- **ESBuild** for production builds
- **tsx** for running TypeScript in Node.js

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd finance-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see Environment Setup above)

4. Initialize the database:
   ```bash
   npm run db:push
   ```
   This creates all necessary tables in your PostgreSQL database.

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:5000`

### Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The build command:
- Bundles the React frontend with Vite
- Bundles the Express backend with esbuild
- Outputs everything to the `dist/` directory

## Usage Guide

### Creating Your First Budget

1. **Register an Account**: Create a new user account from the auth page
2. **Set Up Categories**: Go to Categories and create expense categories (e.g., Food, Transport, Entertainment)
3. **Add Transactions**: 
   - Manually add individual transactions, or
   - Upload a PDF bank statement for automatic import
4. **Set Budget Limits**: Edit categories to add monthly budget limits
5. **Track Progress**: View the Dashboard to see spending by category

### Managing Transactions

#### Manual Entry
1. Navigate to the Transactions page
2. Click "Add Transaction"
3. Fill in the details (date, provider, description, amount, category)
4. Submit to save

#### PDF Import
1. Go to Transactions
2. Click "Upload PDF"
3. Select your bank statement PDF file
4. The system will automatically extract transactions
5. Review and categorize imported transactions

### Portfolio Management

1. Navigate to the Portfolio page
2. Select the month you want to track
3. Choose either Savings or Investments tab
4. Use Quick Adjust buttons to add/subtract amounts
5. Or click the edit icon to set an exact value

### Understanding the Dashboard

- **Income**: Total positive transactions for the month
- **Expenses**: Total negative transactions (automatically calculated)
- **Balance**: Income minus expenses
- **Top Categories**: Shows your 5 biggest expense categories
- **Spending Chart**: Visual breakdown of expenses by category

## API Endpoints

All protected routes require the `Authorization: Bearer <JWT_TOKEN>` header.

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token

### Transactions
- `GET /api/transactions` - Get all user transactions (optionally filter by month with `?month=YYYY-MM`)
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update existing transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `DELETE /api/transactions/clear-all` - Delete all user transactions
- `POST /api/transactions/upload-pdf` - Upload and parse PDF bank statement (multipart/form-data)

### Categories
- `GET /api/categories` - Get all user categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update existing category
- `DELETE /api/categories/:id` - Delete category

### Savings & Investments (Portfolio)
- `GET /api/savings-pots` - Get all savings/investment pots (filter by `?type=savings` or `?type=investments`)
- `POST /api/savings-pots` - Create new pot
- `PUT /api/savings-pots/:id` - Update pot amount
- `DELETE /api/savings-pots/:id` - Delete pot

### Monthly Data
- `GET /api/monthly-data` - Get all monthly summaries
- `GET /api/monthly-data/:monthYear` - Get specific month data (format: YYYY-MM)
- `PUT /api/monthly-data/:monthYear` - Update monthly data

### Settings
- `GET /api/settings` - Get user preferences
- `PUT /api/settings` - Update user preferences (currency, theme)

## Database Schema

The application uses PostgreSQL with the following tables:

### Tables
- **users** - User accounts with authentication
  - `id` (uuid), `username`, `email`, `password` (hashed), `resetToken`, `resetTokenExpiry`, `createdAt`
- **user_settings** - User preferences
  - `userId` (FK), `currency`, `theme`
- **categories** - Income and expense categories
  - `id` (uuid), `userId` (FK), `type` (income/expense), `name`, `icon`, `color`, `budgetLimit`, `createdAt`
- **transactions** - All financial transactions
  - `id` (uuid), `userId` (FK), `type` (income/expense), `date`, `description`, `provider`, `amount`, `categoryId` (FK), `monthYear`, `createdAt`
- **category_mappings** - Provider-to-category learning system
  - `id` (uuid), `userId` (FK), `provider`, `categoryId` (FK), `createdAt`
- **savings_pots** - Savings and investment tracking
  - `id` (uuid), `userId` (FK), `name`, `amount`, `type` (savings/investments), `createdAt`, `updatedAt`
- **monthly_data** - Monthly financial summaries
  - `id` (uuid), `userId` (FK), `monthYear`, `income`, `expenses`, `savings`, `investments`, `updatedAt`

All tables use UUID primary keys and cascade delete on user removal.

## Features in Detail

### Smart Auto-Categorization
The system learns from your manual categorizations. When you assign a category to a transaction from a specific provider (e.g., "Starbucks" → "Food"), it remembers this mapping. Future transactions from the same provider are automatically categorized.

### Automatic Expense Calculation
Monthly expenses are automatically calculated from your transactions. When you add, update, or delete a transaction, the system recalculates the total expenses for that month.

### Responsive Design
The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones

### Dark Mode Support
Toggle between light and dark themes for comfortable viewing in any lighting condition.

## Deployment

### Environment Variables for Production

Ensure these are set in your production environment:
- `DATABASE_URL` - Production PostgreSQL connection string
- `JWT_SECRET` - Unique secret for JWT signing
- `BREVO_API_KEY` - Brevo API key for transactional emails
- `FROM_EMAIL` - Verified sender email address
- `FROM_NAME` - Email sender name
- `BASE_URL` - Your production domain (e.g., `https://yourapp.com`)
- `NODE_ENV=production`
- `PORT` - Port to run on (default: 5000)

### Build for Production

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Build the application
npm run build

# Start the server
npm start
```

### Deployment Platforms

This application can be deployed to:
- **Vercel**: Use Node.js runtime, set build command to `npm run build`, start command to `npm start`
- **Railway**: Connect your repo, Railway auto-detects configuration
- **Render**: Web service with Node environment
- **DigitalOcean App Platform**: Node.js app with PostgreSQL database
- **AWS/GCP/Azure**: Use any VPS with Node.js and PostgreSQL
- **Heroku**: Standard Node.js deployment with Postgres add-on

### Database Setup

For production, use a managed PostgreSQL service:
- [Neon](https://neon.tech/) - Serverless Postgres (recommended)
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Railway](https://railway.app/) - Postgres included
- [Render](https://render.com/) - Managed Postgres
- AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL

## Testing

The application includes comprehensive data-testid attributes for automated testing. All interactive elements and data displays include unique test IDs following this pattern:
- Interactive elements: `button-{action}`, `input-{field}`, `select-{field}`
- Display elements: `text-{content}`, `card-{type}-{id}`

See `TESTING_CHECKLIST.md` for a complete testing guide covering all 150+ features and interactions.

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities and helpers
│   │   └── hooks/        # Custom React hooks
├── server/              # Backend Express application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication logic
│   ├── storage.ts       # Data access layer
│   ├── db.ts            # Database connection
│   └── pdf-parser.ts    # PDF parsing logic
├── shared/              # Shared code between frontend and backend
│   └── schema.ts        # Database schema and types
└── test-api.js          # API test suite
```

## Contributing

This is a personal finance tracker designed for individual use. Feel free to fork and customize it for your own needs.

## License

MIT

## Support

For issues or questions, please refer to the codebase or create an issue in the repository.