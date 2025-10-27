# Finance Tracker - Smart Money Management

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
- **Multi-Currency**: Support for multiple currencies (USD, EUR, GBP, etc.)
- **Dark Mode**: Full light/dark theme support
- **Mobile-First**: Bottom tab navigation optimized for mobile devices

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Tailwind CSS + Shadcn UI components
- Wouter for routing
- React Query for state management
- Recharts for data visualization
- Inter font for modern typography

### Backend
- Express.js with TypeScript
- PostgreSQL database via Drizzle ORM
- PDF-parse for PDF extraction
- bcrypt for password hashing
- JWT for authentication
- Multer for file uploads

## Database Schema
- **users**: User accounts with authentication
- **user_settings**: Currency and theme preferences
- **categories**: Custom spending categories
- **transactions**: All financial transactions
- **category_mappings**: Learning system for auto-categorization
- **monthly_data**: Monthly financial summaries

## Design Philosophy
- Fintech-inspired design (Revolut, Monzo, YNAB)
- Mobile-first with bottom tab navigation
- Clean, professional aesthetics
- Large touch targets (min 44x44px)
- Tabular numbers for financial data
- Color-coded categories
- Bottom sheet modals on mobile

## Recent Changes
- Created complete data schema with 6 tables
- Built all frontend components with exceptional design quality
- Implemented theme system with dark mode support
- Created mobile-first bottom navigation
- Built auth, dashboard, transactions, categories, portfolio, and settings pages
- Added month selector for historical data viewing

## Development Status
✅ Phase 1: Schema & Frontend - COMPLETED
✅ Phase 2: Backend Implementation - COMPLETED
✅ Phase 3: Integration & Testing - COMPLETED

## Implementation Highlights
- **Authentication**: Full JWT-based auth with bcrypt password hashing, persistent sessions
- **PDF Parsing**: Custom regex-based parser that extracts transaction date, description, provider, and amount
- **Smart Categorization**: Learning system using category_mappings table - automatically categorizes future transactions based on user's past choices
- **API Integration**: All pages connected to backend with React Query for optimized data fetching
- **Settings Sync**: Currency and theme settings persist to database and propagate across entire app
- **Mobile-First UI**: Beautiful, responsive design with bottom navigation, cards, and touch-friendly controls
- **Dark Mode**: Full theme support with synchronized database persistence

## User Preferences
- Mobile-first design is critical ✅
- Simple username/password authentication (not Replit Auth) ✅
- No OpenAI - use pattern matching for PDF parsing ✅
- Learning categorization system that improves over time ✅
- All settings (currency, theme) must propagate across entire app ✅
