
# Complete Finance Tracker Application Build Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Database Design](#database-design)
5. [Authentication System](#authentication-system)
6. [Core Features Implementation](#core-features-implementation)
7. [PDF Parsing Engine](#pdf-parsing-engine)
8. [Smart Categorization System](#smart-categorization-system)
9. [Frontend Architecture](#frontend-architecture)
10. [API Design](#api-design)
11. [Deployment Strategy](#deployment-strategy)

---

## Project Overview

A full-stack personal finance management application with intelligent PDF bank statement parsing, automated transaction categorization, and comprehensive budget tracking.

**Key Capabilities:**
- User authentication with password reset via email
- Manual transaction entry and bulk PDF import
- Category-based budget management
- Income and expense tracking
- Savings and investment portfolio management
- Multi-currency support
- Dark/light theme
- Mobile-first responsive design

---

## Technology Stack

### Frontend
- **React 18** - UI library with modern hooks
- **TypeScript** - Type safety across the application
- **Wouter** - Lightweight routing (< 2KB)
- **TanStack Query** - Server state management, caching, and invalidation
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Pre-built accessible components based on Radix UI
- **Recharts** - Data visualization for spending charts

### Backend
- **Node.js 20** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety on the server
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Relational database (via Neon serverless)
- **JWT** - Stateless authentication tokens
- **Bcrypt** - Password hashing
- **Brevo API** - Transactional email service
- **pdf-parse** - PDF text extraction
- **Multer** - File upload handling

### Development Tools
- **Vite** - Fast build tool and dev server
- **ESBuild** - Production bundling
- **tsx** - TypeScript execution for development
- **Drizzle Kit** - Database migration management

---

## Architecture & Design Patterns

### Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # Shadcn base components
│   │   │   └── *.tsx     # Custom components
│   │   ├── pages/        # Route-level components
│   │   ├── lib/          # Utilities and context providers
│   │   └── hooks/        # Custom React hooks
│   └── index.html        # HTML entry point
├── server/               # Backend Express application
│   ├── routes.ts        # API endpoint definitions
│   ├── storage.ts       # Database access layer
│   ├── auth.ts          # Authentication logic
│   ├── pdf-parser.ts    # PDF processing engine
│   └── db.ts            # Database connection
├── shared/              # Code shared between client & server
│   └── schema.ts        # Database schema and Zod validators
└── package.json         # Dependencies and scripts
```

### Design Patterns Used

**1. Repository Pattern (Storage Layer)**
- All database operations go through `storage.ts`
- Provides abstraction over Drizzle ORM
- Makes it easy to swap database implementations
- Enables easier testing with mocks

**2. Middleware Pattern**
- Authentication middleware (`authMiddleware`)
- Rate limiting middleware (`rateLimitPasswordReset`)
- Request logging middleware
- Error handling middleware

**3. Provider Pattern (Frontend)**
- `AuthProvider` - Global authentication state
- `ThemeProvider` - Dark/light mode management
- `QueryClientProvider` - TanStack Query setup
- `TooltipProvider` - Tooltip context

**4. Custom Hooks Pattern**
- Encapsulate reusable logic
- Examples: `useAuth`, `useMobile`, `useToast`

**5. Schema Validation Pattern**
- Shared Zod schemas between client and server
- Type inference from schemas for TypeScript
- Runtime validation of all inputs

---

## Database Design

### Schema Overview

**Core Tables:**

1. **users** - User accounts
   - id (UUID primary key)
   - username (unique)
   - email (unique)
   - password (bcrypt hashed)
   - resetToken (nullable)
   - resetTokenExpiry (nullable timestamp)
   - createdAt

2. **user_settings** - User preferences
   - userId (foreign key to users, primary key)
   - currency (USD, EUR, GBP, JPY, CAD, AUD)
   - theme (light, dark)

3. **categories** - Income/Expense categories
   - id (UUID)
   - userId (foreign key)
   - type (income/expense)
   - name
   - icon (icon identifier)
   - color (hex code)
   - budgetLimit (nullable decimal)
   - createdAt

4. **transactions** - All financial transactions
   - id (UUID)
   - userId (foreign key)
   - type (income/expense)
   - date (timestamp)
   - description
   - provider (merchant/source name)
   - amount (decimal)
   - categoryId (nullable foreign key)
   - monthYear (YYYY-MM format for filtering)
   - createdAt

5. **category_mappings** - Learning system
   - id (UUID)
   - userId (foreign key)
   - provider (merchant name)
   - categoryId (foreign key)
   - createdAt

6. **savings_pots** - Savings and investments
   - id (UUID)
   - userId (foreign key)
   - name
   - amount (decimal)
   - type (savings/investments)
   - createdAt
   - updatedAt

7. **monthly_data** - Monthly summaries
   - id (UUID)
   - userId (foreign key)
   - monthYear (YYYY-MM)
   - income (decimal)
   - expenses (decimal)
   - savings (decimal)
   - investments (decimal)
   - updatedAt

### Key Database Decisions

**Why PostgreSQL?**
- ACID compliance for financial data
- Strong typing support
- JSON support for future extensibility
- Excellent performance for complex queries
- Native UUID support

**Why Drizzle ORM?**
- Type-safe queries without code generation
- Lightweight compared to TypeORM/Prisma
- SQL-like syntax (easier to optimize)
- Better tree-shaking for smaller bundles
- Direct SQL escape hatch when needed

**Indexing Strategy:**
- Primary keys on all id fields
- Unique indexes on username and email
- Index on userId for all user-scoped tables
- Index on monthYear for transaction filtering
- Composite index on (userId, provider) for category_mappings

**Cascade Deletion:**
- All user data deleted when user is deleted (`onDelete: "cascade"`)
- Categories set to null when deleted (`onDelete: "set null"`)

---

## Authentication System

### Password Security

**Hashing Implementation:**
```typescript
import bcrypt from 'bcryptjs';

// Hash password (10 rounds - balanced security/performance)
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// Compare password
function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Validated with Zod schema

### JWT Token System

**Token Generation:**
```typescript
import jwt from 'jsonwebtoken';

function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );
}
```

**Token Verification Middleware:**
```typescript
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Password Reset Flow

**1. Request Reset:**
- User enters email
- System generates random 32-byte token
- Token is SHA-256 hashed before storing
- Original token sent via email
- Token expires in 1 hour

**2. Reset Token Generation:**
```typescript
import crypto from 'crypto';

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getResetTokenExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}
```

**3. Email Delivery:**
- Uses Brevo API for reliable delivery
- Transactional email template
- Includes reset link with token
- Link format: `{BASE_URL}/reset-password?token={TOKEN}`

**4. Password Reset:**
- User clicks link, enters new password
- Token is hashed and verified against database
- Expiry checked
- Password updated, token cleared

**Rate Limiting:**
- Maximum 3 password reset requests per 15 minutes per IP
- Prevents brute force attacks
- Uses in-memory store (for production, use Redis)

---

## Core Features Implementation

### Transaction Management

**Creating Transactions:**
```typescript
// Manual entry
POST /api/transactions
{
  type: "expense",
  date: "2025-01-15T10:30:00Z",
  description: "Grocery shopping",
  provider: "Whole Foods",
  amount: "87.50",
  categoryId: "uuid-here",
  monthYear: "2025-01"
}
```

**Automatic monthYear Calculation:**
- Extracted from transaction date
- Format: YYYY-MM
- Used for filtering and monthly summaries

**Updating Transactions:**
- Amount changes trigger monthly data recalculation
- Category changes create/update provider mappings
- Date changes may affect multiple months

**Monthly Data Auto-Update:**
```typescript
async function updateMonthlyData(userId: string, monthYear: string) {
  const transactions = await storage.getTransactions(userId, monthYear);
  
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
  
  await storage.createOrUpdateMonthlyData({
    userId,
    monthYear,
    income: income.toString(),
    expenses: expenses.toString(),
    // Preserve existing savings/investments
  });
}
```

### Budget Tracking

**Category Budget Limits:**
- Optional budgetLimit field on categories
- Frontend calculates spent vs. limit
- Visual progress indicators
- Warnings when approaching limit

**Budget Calculation:**
```typescript
// Get all transactions for category in current month
const spent = transactions
  .filter(t => t.categoryId === categoryId && t.monthYear === currentMonth)
  .reduce((sum, t) => sum + parseFloat(t.amount), 0);

const percentUsed = (spent / budgetLimit) * 100;
```

### Portfolio Management

**Savings Pots:**
- Named containers for savings goals
- Examples: "Emergency Fund", "Vacation", "New Car"
- Track amount and last updated time

**Investment Tracking:**
- Separate pots for investments
- Examples: "Stocks", "Crypto", "401k"
- Manual amount updates (no brokerage integration)

**Monthly Totals:**
- Stored in monthly_data table
- Separate from savings_pots (pots are ongoing, monthly_data is snapshots)
- Used for portfolio trend analysis

---

## PDF Parsing Engine

### Implementation Strategy

**1. File Upload:**
```typescript
import multer from 'multer';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.post('/api/transactions/upload-pdf', 
  authMiddleware, 
  upload.single('pdf'), 
  async (req, res) => {
    const buffer = req.file.buffer;
    const transactions = await parsePdfStatement(buffer);
    // Process transactions...
  }
);
```

**2. Text Extraction:**
```typescript
import pdfParse from 'pdf-parse';

async function parsePdfStatement(buffer: Buffer) {
  const data = await pdfParse(buffer);
  const text = data.text;
  
  // Parse text with multiple patterns
  return extractTransactions(text);
}
```

**3. Pattern Matching:**

The system uses 11 different regex patterns to match various bank statement formats:

```typescript
const patterns = [
  // Pattern 1: Date, Description, Debit, Credit (most common)
  {
    regex: /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z0-9\s\-&',\.]+?)\s+(?:(\d{1,3}(?:,\d{3})*\.\d{2})\s+)?(?:(\d{1,3}(?:,\d{3})*\.\d{2}))?/g,
    extractors: {
      date: (match) => match[1],
      description: (match) => match[2].trim(),
      debit: (match) => match[3] ? parseFloat(match[3].replace(/,/g, '')) : null,
      credit: (match) => match[4] ? parseFloat(match[4].replace(/,/g, '')) : null,
    }
  },
  
  // Pattern 2: DD-MMM-YYYY format
  {
    regex: /(\d{2}-[A-Z]{3}-\d{4})\s+([A-Za-z0-9\s\-&',\.]+?)\s+(-?\d{1,3}(?:,\d{3})*\.\d{2})/gi,
    extractors: {
      date: (match) => convertDate(match[1]), // Convert to YYYY-MM-DD
      description: (match) => match[2].trim(),
      amount: (match) => parseFloat(match[3].replace(/,/g, '')),
    }
  },
  
  // Pattern 3-11: Additional formats for different banks
  // ...
];
```

**4. Sequential Fallback Approach:**
```typescript
function extractTransactions(text: string): ParsedTransaction[] {
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern.regex)];
    
    if (matches.length > 0) {
      const transactions = matches.map(match => ({
        date: pattern.extractors.date(match),
        description: pattern.extractors.description(match),
        provider: extractProvider(pattern.extractors.description(match)),
        amount: calculateAmount(match, pattern.extractors),
      }));
      
      // Validate transactions
      if (transactions.every(isValidTransaction)) {
        return transactions;
      }
    }
  }
  
  throw new Error('Unable to parse PDF statement');
}
```

**5. Provider Extraction:**
```typescript
function extractProvider(description: string): string {
  // Remove common prefixes
  const cleaned = description
    .replace(/^(POS|ATM|DIRECT DEBIT|PAYMENT|TRANSFER)\s+/i, '')
    .replace(/\s+\d{2}\/\d{2}\/\d{4}.*$/, '') // Remove trailing dates
    .replace(/\s+REF:.*$/i, '') // Remove reference numbers
    .trim();
  
  // Take first meaningful part
  const parts = cleaned.split(/\s{2,}/);
  return parts[0] || cleaned;
}
```

**6. Duplicate Detection:**
```typescript
async function findDuplicateTransaction(
  userId: string,
  date: Date,
  description: string,
  provider: string,
  amount: string
): Promise<Transaction | null> {
  const transactions = await storage.getTransactions(userId);
  
  return transactions.find(t => 
    t.date.toISOString().split('T')[0] === date.toISOString().split('T')[0] &&
    t.description === description &&
    t.provider === provider &&
    t.amount === amount
  ) || null;
}
```

---

## Smart Categorization System

### How It Works

**1. Manual Categorization Creates Learning:**
```typescript
// When user assigns category to transaction
app.put('/api/transactions/:id', async (req: AuthRequest, res) => {
  const { categoryId } = req.body;
  const transaction = await storage.updateTransaction(id, userId, { categoryId });
  
  // Create or update mapping
  if (categoryId && transaction.provider) {
    await storage.upsertCategoryMapping(userId, transaction.provider, categoryId);
  }
});
```

**2. Upsert Category Mapping:**
```typescript
async function upsertCategoryMapping(
  userId: string,
  provider: string,
  categoryId: string
) {
  // Check if mapping exists
  const existing = await db.query.categoryMappings.findFirst({
    where: and(
      eq(categoryMappings.userId, userId),
      sql`LOWER(${categoryMappings.provider}) = LOWER(${provider})`
    ),
  });
  
  if (existing) {
    // Update existing mapping
    await db.update(categoryMappings)
      .set({ categoryId })
      .where(eq(categoryMappings.id, existing.id));
  } else {
    // Create new mapping
    await db.insert(categoryMappings).values({
      userId,
      provider,
      categoryId,
    });
  }
}
```

**3. Auto-Categorization on PDF Import:**
```typescript
// During PDF processing
const mappings = await storage.getCategoryMappings(userId);
const mappingMap = new Map(
  mappings.map(m => [m.provider.toLowerCase(), m.categoryId])
);

for (const parsed of parsedTransactions) {
  const categoryId = mappingMap.get(parsed.provider.toLowerCase()) || null;
  
  await storage.createTransaction({
    ...parsed,
    categoryId, // Automatically assigned if mapping exists
  });
}
```

**4. Case-Insensitive Matching:**
- All provider names converted to lowercase for comparison
- Handles variations like "WHOLE FOODS" vs "Whole Foods"

**5. Learning Persistence:**
- Mappings persist across sessions
- One-time categorization teaches future imports
- User can override by recategorizing

---

## Frontend Architecture

### State Management Strategy

**TanStack Query for Server State:**
```typescript
// Fetching data
const { data: transactions, isLoading } = useQuery({
  queryKey: ['/api/transactions', monthYear],
  queryFn: async () => {
    const res = await fetch(`/api/transactions?month=${monthYear}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
});

// Mutations with automatic refetch
const createTransaction = useMutation({
  mutationFn: async (data: InsertTransaction) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/monthly-data'] });
  },
});
```

**React Context for Client State:**
```typescript
// AuthContext
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem('token')
  );
  
  // Auto-fetch user on mount if token exists
  useEffect(() => {
    if (token) {
      fetchUser(token).then(setUser);
    }
  }, [token]);
  
  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };
  
  // ... other methods
  
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Component Organization

**1. Atomic Design Principles:**
- **Atoms:** `ui/` components (Button, Input, Card, etc.)
- **Molecules:** Composed components (StatCard, CategoryBadge, MonthSelector)
- **Organisms:** Feature components (BottomNav)
- **Pages:** Route-level components (Dashboard, Transactions, etc.)

**2. Shadcn UI Integration:**
- Pre-built accessible components
- Customizable via Tailwind
- Copy-paste into project (not npm package)
- Easy to modify and extend

**3. Form Handling:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<InsertTransaction>({
  resolver: zodResolver(insertTransactionSchema),
  defaultValues: {
    type: 'expense',
    date: new Date().toISOString(),
    description: '',
    provider: '',
    amount: '',
    categoryId: null,
  },
});

const onSubmit = async (data: InsertTransaction) => {
  await createTransaction.mutateAsync(data);
  form.reset();
};
```

### Mobile-First Design

**Bottom Navigation:**
```typescript
// Sticky bottom nav for mobile
<nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
  <div className="flex justify-around items-center h-16">
    <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
    <NavLink to="/transactions" icon={Receipt} label="Transactions" />
    <NavLink to="/portfolio" icon={PiggyBank} label="Portfolio" />
    <NavLink to="/settings" icon={Settings} label="Settings" />
  </div>
</nav>
```

**Responsive Breakpoints:**
- Mobile: < 768px (bottom nav, single column)
- Tablet: 768px - 1024px (2 column layout)
- Desktop: > 1024px (3 column layout, sidebar)

**Touch Optimization:**
- Minimum 44x44px touch targets
- Large interactive areas
- Swipe gestures for actions
- Pull-to-refresh (future enhancement)

### Dark Mode Implementation

**CSS Variables:**
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  /* ... */
}
```

**Theme Provider:**
```typescript
function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [theme, setTheme] = useState(() => 
    localStorage.getItem('theme') || defaultTheme
  );
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## API Design

### RESTful Endpoints

**Authentication:**
```
POST   /api/auth/register          - Create new user
POST   /api/auth/login             - Login user
GET    /api/auth/me                - Get current user
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
```

**User Settings:**
```
GET    /api/settings               - Get user settings
PUT    /api/settings               - Update settings
```

**Categories:**
```
GET    /api/categories             - List categories
POST   /api/categories             - Create category
PUT    /api/categories/:id         - Update category
DELETE /api/categories/:id         - Delete category
```

**Transactions:**
```
GET    /api/transactions           - List transactions (optional ?month=YYYY-MM)
POST   /api/transactions           - Create transaction
PUT    /api/transactions/:id       - Update transaction
DELETE /api/transactions/:id       - Delete transaction
DELETE /api/transactions/clear-all - Delete all user transactions
POST   /api/transactions/upload-pdf - Import PDF statement
```

**Monthly Data:**
```
GET    /api/monthly-data           - Get all monthly data
GET    /api/monthly-data/:monthYear - Get specific month
PUT    /api/monthly-data/:monthYear - Update monthly data
```

**Portfolio:**
```
GET    /api/portfolio              - Get current month portfolio
PUT    /api/portfolio/savings      - Update savings total
PUT    /api/portfolio/investments  - Update investments total
GET    /api/savings-pots           - List savings pots (optional ?type=savings|investments)
POST   /api/savings-pots           - Create pot
PUT    /api/savings-pots/:id       - Update pot
DELETE /api/savings-pots/:id       - Delete pot
```

### Error Handling

**Consistent Error Responses:**
```typescript
// All errors return JSON with error field
{
  "error": "Descriptive error message"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 404: Not Found
- 500: Internal Server Error

**Global Error Handler:**
```typescript
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler:', err);
  
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      message: err.message || 'An unexpected error occurred'
    });
  }
});
```

### Request Validation

**Zod Schema Validation:**
```typescript
// Shared schema from shared/schema.ts
app.post('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const data = insertTransactionSchema.parse(req.body);
    // Data is now type-safe and validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: error.errors[0].message 
      });
    }
    throw error;
  }
});
```

---

## Deployment Strategy

### Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=random-64-character-hex-string
BREVO_API_KEY=xkeysib-xxxxx
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Finance Tracker
BASE_URL=https://yourapp.com
```

**Optional:**
```env
PORT=5000
NODE_ENV=production
```

### Build Process

**1. Install Dependencies:**
```bash
npm install
```

**2. Build Frontend:**
```bash
vite build
# Output: dist/public/
```

**3. Build Server:**
```bash
# Bundle server routes and modules
esbuild server/routes.ts server/storage.ts server/auth.ts \
  --platform=node --packages=external --bundle --format=esm \
  --outdir=dist/server

# Bundle entry point
esbuild server/index.ts server/app.ts server/vite.ts server/db.ts \
  --platform=node --packages=external --bundle --format=esm \
  --outdir=dist
```

**4. Database Migration:**
```bash
npm run db:push
```

**5. Start Production:**
```bash
NODE_ENV=production node dist/index.js
```

### Deployment on Render

**1. Create PostgreSQL Database:**
- Go to Render Dashboard
- Click "New +" and select "PostgreSQL"
- Choose a name and region
- Copy the "Internal Database URL"

**2. Create Web Service:**
- Click "New +" and select "Web Service"
- Connect your GitHub repository
- Configure settings:
  - **Name:** finance-tracker (or preferred name)
  - **Runtime:** Node
  - **Build Command:** `npm install && npm run build`
  - **Start Command:** `npm start`
  - **Node Version:** 20.11.0

**3. Environment Setup:**
- Go to the "Environment" tab
- Add environment variables:
  - `DATABASE_URL` - PostgreSQL connection string from step 1
  - `JWT_SECRET` - Generate with: `openssl rand -base64 32`
  - `BREVO_API_KEY` - From Brevo Dashboard
  - `FROM_EMAIL` - Your verified sender email
  - `FROM_NAME` - Display name (e.g., "Finance Tracker")
  - `BASE_URL` - Your app URL (e.g., `https://your-app.onrender.com`)
  - `NODE_VERSION` - 20.11.0

**4. Initialize Database:**
- After first deployment, go to your web service
- Click "Shell" tab
- Run: `npm run db:push`

**5. Deploy:**
- Click "Create Web Service"
- Render will automatically deploy your app
- Your app will be available at `https://your-app-name.onrender.com`

**Alternative: Using render.yaml**
- The repository includes a `render.yaml` file
- Click "New +" → "Blueprint" in Render Dashboard
- Connect repository and Render will configure automatically
- Add required environment variables after creation

### Production Considerations

**Database Connection Pooling:**
```typescript
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum pool size
});
```

**Automatic Database Initialization:**
```typescript
async function initializeDatabase() {
  try {
    // Check if schema exists
    await db.execute(sql`SELECT 1 FROM users LIMIT 1`);
  } catch (error) {
    // Run migrations
    await runMigrations();
  }
}
```

**Health Checks:**
```typescript
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});
```

**Logging:**
```typescript
// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});
```

---

## Security Best Practices

### Password Security
- Bcrypt with 10 rounds (balanced performance/security)
- Minimum 8 characters with complexity requirements
- Never store plaintext passwords

### Token Security
- JWT tokens expire in 30 days
- Tokens stored in localStorage (consider httpOnly cookies for extra security)
- Reset tokens expire in 1 hour
- Reset tokens hashed before storage

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevented by parameterized queries (Drizzle ORM)
- File uploads limited to 10MB
- PDF files validated before processing

### Rate Limiting
- Password reset: 3 attempts per 15 minutes per IP
- Consider adding rate limiting to login endpoint

### Data Access Control
- All endpoints require authentication (except register/login)
- User data filtered by userId in all queries
- Foreign key constraints prevent unauthorized access

### HTTPS
- Always use HTTPS in production
- Replit provides automatic SSL certificates

---

## Performance Optimizations

### Frontend
- Code splitting with dynamic imports
- React.lazy() for route-based splitting
- TanStack Query caching (staleTime, cacheTime)
- Optimistic updates for better UX
- Debounced search inputs

### Backend
- Database connection pooling
- Indexed queries (userId, monthYear)
- Selective field loading (avoid SELECT *)
- Batch operations where possible
- In-memory caching for category mappings

### Build
- Vite for fast HMR in development
- ESBuild for production bundling
- Tree-shaking to remove unused code
- Minification and compression

---

## Testing Strategy

### Unit Tests
- Test utility functions (extractProvider, calculateAmount)
- Test validation schemas
- Test authentication logic

### Integration Tests
- Test API endpoints
- Test database operations
- Test PDF parsing with sample files

### E2E Tests
- Test complete user flows
- Test transaction creation and categorization
- Test PDF upload and processing

### Manual Testing Checklist
- See TESTING_CHECKLIST.md for comprehensive list
- Test on mobile devices
- Test with different PDF formats
- Test edge cases (large amounts, special characters)

---

## Future Enhancements

### Features
- Recurring transactions
- Budget alerts and notifications
- Data export (CSV, PDF reports)
- Multi-account support
- Shared budgets (family/roommates)
- Brokerage API integration for investments
- Receipt photo uploads and OCR
- Spending predictions with ML

### Technical
- Real-time updates with WebSockets
- Progressive Web App (PWA)
- Offline support with service workers
- Redis for caching and rate limiting
- GraphQL API option
- Microservices architecture for scale

---

## Common Pitfalls to Avoid

1. **Not validating inputs** - Always use Zod schemas
2. **Storing passwords in plaintext** - Always hash with bcrypt
3. **SQL injection** - Use ORM or parameterized queries
4. **Not handling errors** - Implement global error handler
5. **Hardcoding secrets** - Use environment variables
6. **Not indexing database** - Add indexes for frequent queries
7. **Not testing PDF parsing** - Test with real bank statements
8. **Ignoring mobile UX** - Design mobile-first
9. **Not implementing rate limiting** - Prevent abuse
10. **Overcomplicating state** - Use TanStack Query for server state

---

## Resources

### Documentation
- React: https://react.dev
- TanStack Query: https://tanstack.com/query
- Drizzle ORM: https://orm.drizzle.team
- Tailwind CSS: https://tailwindcss.com
- Shadcn UI: https://ui.shadcn.com

### Tools
- Replit: https://replit.com
- Neon (Serverless Postgres): https://neon.tech
- Brevo (Email): https://brevo.com

### Learning
- TypeScript Handbook: https://www.typescriptlang.org/docs
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- React Patterns: https://reactpatterns.com

---

## Conclusion

This guide covers everything needed to build a production-ready finance tracking application. The architecture is scalable, secure, and maintainable. Start with the core features (auth, transactions, categories) and progressively enhance with PDF parsing, smart categorization, and portfolio management.

Remember: Focus on user experience, validate all inputs, and test thoroughly before deploying to production.
