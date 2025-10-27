# Personal Finance Tracker

A comprehensive full-stack personal finance management application built with React, Express, and PostgreSQL. Track your expenses, manage budgets, monitor investments, and gain insights into your spending habits.

## Features

### 💰 Transaction Management
- **Manual Entry**: Add transactions with date, description, provider, amount, and category
- **PDF Import**: Upload bank statement PDFs to automatically extract and import transactions
- **Smart Categorization**: Auto-categorize transactions based on learned provider patterns
- **Bulk Operations**: Edit and delete multiple transactions efficiently

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
- **User Accounts**: Secure registration and login
- **Password Hashing**: Industry-standard bcrypt password encryption
- **Session Management**: JWT token-based authentication
- **Data Isolation**: Each user's data is completely separate and private

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

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with your database connection string:
```
DATABASE_URL=postgresql://user:password@host/database
```

3. Push database schema:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

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

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get all transactions (optionally filter by month)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/upload-pdf` - Upload and parse PDF statement

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Portfolio
- `GET /api/portfolio` - Get current portfolio values
- `PUT /api/portfolio/savings` - Update savings
- `PUT /api/portfolio/investments` - Update investments

### Monthly Data
- `GET /api/monthly-data` - Get all monthly data
- `GET /api/monthly-data/:monthYear` - Get specific month data
- `PUT /api/monthly-data/:monthYear` - Update monthly data

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## Database Schema

### Tables
- **users** - User accounts
- **user_settings** - User preferences (currency, theme)
- **categories** - Expense categories
- **transactions** - Financial transactions
- **category_mappings** - Provider-to-category learned mappings
- **monthly_data** - Monthly financial summaries

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

## Testing

Run the included test suite:
```bash
node test-api.js
```

This tests all major API endpoints including:
- User registration and authentication
- Category management
- Transaction CRUD operations
- Portfolio updates
- Settings management

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
