# Finance Tracker - Development Guide

## Overview
A mobile-first finance tracker application with intelligent PDF bank statement parsing and automated transaction categorization. Built with React 18+, TypeScript, Express, and PostgreSQL.

## Key Features
- **Custom Authentication**: Secure username/password auth with bcrypt and JWT
- **Smart PDF Parsing**: Upload bank statements and automatically extract transactions
- **Learning System**: Automatically categorizes transactions based on user's historical choices
- **Dashboard**: Monthly overview of income, expenses, savings, and investments
- **Transaction Management**: View, search, and categorize all transactions
- **Category System**: Create and manage custom spending categories
- **Portfolio Tracking**: Track and update savings and investments with history
- **Multi-Currency**: Support for multiple currencies (USD, EUR, GBP, JPY, CAD, AUD)
- **Dark Mode**: Full light/dark theme support
- **Mobile-First**: Bottom tab navigation optimized for mobile devices
- **Password Reset**: Email-based password reset via Brevo

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Tailwind CSS + Shadcn UI components
- Wouter for routing
- TanStack React Query (v5) for state management
- Recharts for data visualization
- Framer Motion for animations
- React Hook Form with Zod validation

### Backend
- Express.js with TypeScript
- PostgreSQL database via Drizzle ORM
- PDF-parse for PDF extraction
- bcrypt for password hashing (10 rounds)
- JWT for authentication
- Multer for file uploads
- Brevo API for transactional emails

### Development Tools
- Vite for fast development and HMR
- TypeScript for type safety
- ESBuild for production builds
- tsx for running TypeScript in Node.js
- Drizzle Kit for database migrations

## Project Structure

```
finance-tracker/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Shadcn UI components
│   │   │   ├── bottom-nav.tsx # Mobile bottom navigation
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── auth.tsx       # Login/Register/Forgot Password
│   │   │   ├── dashboard.tsx  # Main dashboard
│   │   │   ├── transactions.tsx
│   │   │   ├── categories.tsx
│   │   │   ├── income.tsx
│   │   │   ├── portfolio.tsx
│   │   │   ├── settings.tsx
│   │   │   └── reset-password.tsx
│   │   ├── lib/               # Utilities and helpers
│   │   │   ├── queryClient.ts # React Query setup
│   │   │   ├── auth-context.tsx
│   │   │   └── theme-provider.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   └── App.tsx            # App entry point with routing
│   └── index.html             # HTML template
├── server/                    # Backend Express application
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API routes
│   ├── auth.ts                # Authentication logic
│   ├── storage.ts             # Data access layer
│   ├── db.ts                  # Database connection
│   ├── pdf-parser.ts          # PDF parsing logic
│   ├── resend-client.ts       # Email service (Brevo)
│   ├── rate-limiter.ts        # Rate limiting for password resets
│   ├── vite.ts                # Vite dev server setup
│   └── ...
├── shared/                    # Shared code between frontend and backend
│   └── schema.ts              # Database schema, Zod schemas, and types
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── drizzle.config.ts          # Drizzle ORM configuration
└── tsconfig.json              # TypeScript configuration
```

## Database Schema

### users
- User accounts with authentication
- Fields: id, username, email, password (hashed), resetToken, resetTokenExpiry, createdAt

### user_settings
- User preferences (currency, theme)
- Fields: userId (FK), currency, theme

### categories
- Custom income and expense categories
- Fields: id, userId (FK), type (income/expense), name, icon, color, budgetLimit, createdAt

### transactions
- All financial transactions
- Fields: id, userId (FK), type (income/expense), date, description, provider, amount, categoryId (FK), monthYear, createdAt

### category_mappings
- Provider-to-category learning system
- Fields: id, userId (FK), provider, categoryId (FK), createdAt

### savings_pots
- Savings and investment tracking
- Fields: id, userId (FK), name, amount, type (savings/investments), createdAt, updatedAt

### monthly_data
- Monthly financial summaries
- Fields: id, userId (FK), monthYear, income, expenses, savings, investments, updatedAt

## Design Philosophy

- **Fintech-inspired design** (Revolut, Monzo, YNAB)
- **Mobile-first** with bottom tab navigation
- **Clean, professional aesthetics**
- **Large touch targets** (min 44x44px)
- **Tabular numbers** for financial data
- **Color-coded categories**
- **Bottom sheet modals** on mobile
- **Dark mode support** throughout

## Development Workflow

### Running Development Server

```bash
npm run dev
```

This starts:
- Express server on port 5000
- Vite dev server with HMR
- Both frontend and backend on the same port

### Database Migrations

```bash
# Push schema changes to database
npm run db:push

# For production or when migrations needed
drizzle-kit push:pg
```

### Type Checking

```bash
npm run check
```

## Implementation Highlights

### Authentication Flow
1. User registers with username, email, password
2. Password is hashed with bcrypt (10 rounds)
3. JWT token generated and returned
4. Token stored in localStorage on frontend
5. All API requests include Authorization header
6. Middleware validates token and attaches userId

### Password Reset Flow
1. User requests reset via email
2. Secure token generated (crypto.randomBytes)
3. Token hashed with SHA-256 and stored in database
4. Email sent via Brevo API with reset link
5. User clicks link, enters new password
6. Token validated (not expired, matches hash)
7. Password updated, token invalidated

### PDF Parsing
1. User uploads PDF bank statement
2. Multer receives file in memory
3. pdf-parse extracts text content
4. Custom regex patterns match transaction lines
5. Extracts: date, description, provider, amount
6. Auto-categorizes using learned provider mappings
7. Creates multiple transactions in database
8. Returns count of imported transactions

### Smart Categorization
1. User assigns category to a transaction
2. System creates category_mapping for that provider
3. When new transaction added with same provider
4. System finds matching category_mapping
5. Auto-assigns learned category
6. User can override if needed

### Settings Propagation
1. User changes currency or theme in Settings
2. Updates user_settings table in database
3. React Query invalidates settings cache
4. All components re-fetch settings
5. Currency symbols update globally
6. Theme class applied to document root

## Mobile-First Design

### Bottom Navigation
- Visible on mobile (<768px)
- Hidden on desktop (≥768px)
- 5 tabs: Dashboard, Transactions, Categories, Income, Portfolio
- Settings accessed from Dashboard
- Active tab highlighted
- Touch-friendly 44x44px minimum

### Responsive Layouts
- Cards stack vertically on mobile
- Forms optimize for mobile keyboards
- Dialogs go full-screen on mobile
- Tables become cards on small screens
- Charts resize dynamically

## User Preferences

- Mobile-first design is critical
- Simple username/password authentication (not OAuth)
- Pattern matching for PDF parsing (not OpenAI)
- Learning categorization system
- All settings (currency, theme) propagate across entire app

## Testing

All pages include comprehensive `data-testid` attributes:
- Interactive elements: `button-{action}`, `input-{field}`
- Display elements: `text-{content}`, `card-{type}-{id}`
- Dynamic elements: `{type}-{description}-{id}`

See `TESTING_CHECKLIST.md` for full testing guide.

## Common Development Tasks

### Add a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link if needed

### Add a New API Endpoint
1. Define route handler in `server/routes.ts`
2. Add storage method in `server/storage.ts`
3. Update types in `shared/schema.ts` if needed

### Add a New Database Table
1. Define table schema in `shared/schema.ts`
2. Create insert schema with `createInsertSchema`
3. Define TypeScript types
4. Run `npm run db:push`
5. Add storage methods in `server/storage.ts`

### Add a New Shadcn Component
```bash
npx shadcn@latest add [component-name]
```

## Environment Variables

Required for development:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `BREVO_API_KEY` - Brevo API key
- `FROM_EMAIL` - Sender email (verified in Brevo)
- `FROM_NAME` - Email sender name
- `BASE_URL` - Application URL for email links
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Database Connection Issues
- Check DATABASE_URL format
- Verify database is running
- Check network/firewall settings

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Vite HMR Not Working
- Check browser console for errors
- Restart dev server
- Clear browser cache

## Best Practices

### Frontend
- Use React Query for all API calls
- Invalidate queries after mutations
- Use proper loading and error states
- Follow existing component patterns
- Use Shadcn components where possible
- Add data-testid to all interactive elements

### Backend
- Validate all inputs with Zod
- Use storage interface, not direct DB calls
- Return proper HTTP status codes
- Log errors but don't expose internals
- Use middleware for auth checks

### Database
- Use transactions for multi-step operations
- Index foreign keys for performance
- Cascade deletes where appropriate
- Store dates in UTC
- Use proper decimal precision for money

## Performance Considerations

- React Query caches API responses
- Vite provides fast HMR in development
- ESBuild bundles for production
- Database queries use indexes
- Images are lazy loaded
- Code splitting at route level

## Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Environment variables for secrets
- SQL injection prevented by Drizzle ORM
- XSS prevented by React escaping
- CSRF not applicable (JWT in headers)
- Rate limiting on password resets
- Reset tokens expire after 1 hour
- Reset tokens single-use only

## Future Enhancements

Potential features to add:
- Export data as CSV/Excel
- Recurring transactions
- Budget alerts/notifications
- Multi-account support
- Shared budgets (family/roommates)
- Receipt image uploads
- Bank API integrations (Plaid)
- Mobile app (React Native)
- Charts and analytics improvements
- Bill payment reminders
- Split transactions

## Support

For issues or questions, refer to:
- README.md - Setup and usage guide
- TESTING_CHECKLIST.md - Testing guide
- GitHub Issues (if applicable)
