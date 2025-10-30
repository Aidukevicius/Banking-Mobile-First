# Development Guide

## Overview
Mobile-first finance tracker with PDF statement parsing and automated transaction categorization.

## Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend:** Express, PostgreSQL, Drizzle ORM, JWT, Brevo
- **Tools:** Vite, TypeScript, ESBuild

## Database Schema

### Core Tables
- `users` - Authentication and user data
- `user_settings` - Currency and theme preferences
- `categories` - Custom income/expense categories
- `transactions` - All financial transactions
- `category_mappings` - Provider-to-category learning
- `savings_pots` - Savings and investment tracking
- `monthly_data` - Monthly financial summaries

## Key Features

### PDF Parsing
- Uses `pdf-parse` to extract text
- 11 regex patterns for different bank formats
- Sequential fallback approach (not all-at-once)
- Auto-categorizes using learned provider mappings

### Smart Categorization
- Creates provider-to-category mappings on manual categorization
- Auto-assigns category for future transactions from same provider
- Case-insensitive matching

### Authentication
- bcrypt password hashing (10 rounds)
- JWT token-based authentication
- Email-based password reset via Brevo
- Secure reset tokens (SHA-256, 1-hour expiry)

## Development Workflow

### Setup
```bash
npm install
npm run db:push
npm run dev
```

### Database Migrations
```bash
npm run db:push
```

### Production Build
```bash
npm run build
npm start
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - JWT signing key
- `BREVO_API_KEY` - Brevo API key
- `FROM_EMAIL` - Sender email
- `FROM_NAME` - Sender name
- `BASE_URL` - App URL
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment

## Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components
│   ├── pages/          # Route pages
│   ├── lib/            # Utils and context
│   └── hooks/          # Custom hooks
├── server/             # Express backend
│   ├── routes.ts       # API endpoints
│   ├── auth.ts         # Authentication
│   ├── storage.ts      # Data access
│   ├── pdf-parser.ts   # PDF processing
│   └── resend-client.ts # Email service
└── shared/
    └── schema.ts       # DB schema and types
```

## Design Philosophy
- Mobile-first bottom navigation
- Fintech-inspired UI
- Large touch targets (44x44px min)
- Dark mode support
- Clean, professional aesthetics

## Best Practices

### Frontend
- Use TanStack Query for API calls
- Invalidate queries after mutations
- Add data-testid to interactive elements

### Backend
- Validate inputs with Zod schemas
- Use storage interface for DB access
- Return proper HTTP status codes

### Security
- Passwords hashed with bcrypt
- JWT tokens in Authorization header
- Rate limiting on password resets
- Single-use reset tokens