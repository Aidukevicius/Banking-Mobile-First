# Finance Tracker - Comprehensive Testing Checklist

## Test Status Legend
- ✅ PASS - Feature works correctly
- ❌ FAIL - Feature has issues
- ⏳ PENDING - Not yet tested

---

## 1. Authentication & Authorization Tests

### Registration Flow
- ⏳ **Register Form Validation**
  - Username field required
  - Email field required and valid format
  - Password requirements (min 8 chars, uppercase, lowercase, number)
  - Confirm password matches
  - Error messages display correctly
- ⏳ **Register Button** (`button-register`)
  - Creates new user account
  - Shows success message
  - Redirects to dashboard
  - Generates default settings (USD currency, light theme)

### Login Flow
- ⏳ **Login Form Validation**
  - Username field required
  - Password field required
- ⏳ **Login Button** (`button-login`)
  - Authenticates existing user
  - Sets JWT token
  - Redirects to dashboard
  - Shows error for invalid credentials

### Forgot Password Flow
- ⏳ **Forgot Password Link** (`link-forgot-password`)
  - Shows forgot password form
- ⏳ **Email Input** (`input-forgot-email`)
  - Accepts email address
- ⏳ **Send Reset Email Button** (`button-send-reset`)
  - Sends password reset email via Brevo
  - Shows success toast
  - Email contains reset link with token

### Reset Password Flow
- ⏳ **Reset Password Page** (`/reset-password?token=...`)
  - Loads with token from URL
  - Shows password reset form
- ⏳ **New Password Validation**
  - Min 8 characters
  - Contains uppercase, lowercase, numbers
  - Confirm password matches
- ⏳ **Reset Password Button** (`button-reset-password`)
  - Updates password in database
  - Invalidates reset token
  - Redirects to login after 3 seconds

---

## 2. Dashboard Tests

### Overview Cards
- ⏳ **Net Income Display** (`text-net-income`)
  - Calculates: income - expenses
  - Updates when transactions change
- ⏳ **Income Display** (`text-income`)
  - Shows total income for selected month
  - Green color styling
- ⏳ **Expenses Display** (`text-expenses`)
  - Shows total expenses for selected month
  - Red color styling
- ⏳ **Savings Display** (`text-savings`)
  - Shows savings from monthly_data
- ⏳ **Investments Display** (`text-investments`)
  - Shows investments from monthly_data

### Month Selector
- ⏳ **Previous Month Button** (`button-prev-month`)
  - Navigates to previous month
  - Updates all dashboard data
- ⏳ **Current Month Display** (`text-current-month`)
  - Shows selected month/year
- ⏳ **Next Month Button** (`button-next-month`)
  - Navigates to next month
  - Updates all dashboard data

### Category Breakdown
- ⏳ **Top Categories List**
  - Shows top 5 expense categories
  - Displays category name, color, amount
  - Shows progress bar for budget limits
- ⏳ **Spending Chart**
  - Pie/Bar chart visualization
  - Color-coded by category
  - Shows percentages

---

## 3. Transactions Page Tests

### Transaction List
- ⏳ **Search Input** (`input-search-transactions`)
  - Filters by description, provider
  - Updates list in real-time
- ⏳ **Transaction Items** (`card-transaction-{id}`)
  - Shows date, description, provider, amount
  - Shows category with color indicator
  - Income shows in green, expenses in default

### Add Transaction
- ⏳ **Add Transaction Button** (`button-add-transaction`)
  - Opens add dialog
- ⏳ **Date Input** (`input-transaction-date`)
  - Accepts date selection
- ⏳ **Description Input** (`input-transaction-description`)
  - Text input for description
- ⏳ **Provider Input** (`input-transaction-provider`)
  - Text input for provider name
- ⏳ **Amount Input** (`input-transaction-amount`)
  - Number input for amount
- ⏳ **Category Select** (`select-transaction-category`)
  - Shows all user categories
  - Filters by transaction type (income/expense)
- ⏳ **Save Transaction Button** (`button-save-transaction`)
  - Creates transaction
  - Updates monthly totals
  - Learns provider-category mapping
  - Shows success toast

### Edit Transaction
- ⏳ **Edit Transaction Button** (`button-edit-transaction-{id}`)
  - Opens edit dialog with pre-filled data
- ⏳ **Update Amount**
  - Changes transaction amount
  - Recalculates monthly totals
- ⏳ **Update Category**
  - Changes transaction category
  - Updates provider mapping
- ⏳ **Save Changes Button** (`button-update-transaction`)
  - Saves edited transaction
  - Invalidates queries
  - Shows success toast

### Delete Transaction
- ⏳ **Delete Transaction Button** (`button-delete-transaction-{id}`)
  - Opens confirmation dialog
- ⏳ **Confirm Delete Button** (`button-confirm-delete`)
  - Removes transaction from database
  - Updates monthly totals
  - Shows success toast

### PDF Upload
- ⏳ **Upload PDF Button** (`button-upload-pdf`)
  - Opens upload dialog
- ⏳ **File Input** (`input-pdf-file`)
  - Accepts PDF files only
- ⏳ **Upload Button** (`button-confirm-upload`)
  - Parses PDF using pdf-parse
  - Extracts transactions (date, description, provider, amount)
  - Auto-categorizes based on learned mappings
  - Creates multiple transactions
  - Shows success message with count

### Categorize Transactions
- ⏳ **Categorize Button** (`button-categorize`)
  - Opens category selection dialog
- ⏳ **Select Transaction**
  - Shows uncategorized transactions
- ⏳ **Select Category** (`select-assign-category`)
  - Shows available categories
- ⏳ **Assign Category Button** (`button-assign-category`)
  - Updates transaction category
  - Learns provider mapping
  - Shows success toast

### Clear All Transactions
- ⏳ **Clear All Button** (`button-clear-all`)
  - Opens confirmation dialog
- ⏳ **Confirm Clear All** (`button-confirm-clear-all`)
  - Deletes all user transactions
  - Resets monthly totals
  - Shows success toast

---

## 4. Categories Page Tests

### Category Tabs
- ⏳ **Expense Tab** (`tab-expense-categories`)
  - Shows expense categories only
  - Default tab
- ⏳ **Income Tab** (`tab-income-categories`)
  - Shows income categories only

### Add Category
- ⏳ **Add Category Button** (`button-add-category`)
  - Opens create dialog
- ⏳ **Category Name Input** (`input-category-name`)
  - Text input for name
- ⏳ **Category Type** (expense/income)
  - Auto-sets based on active tab
- ⏳ **Color Picker** (`color-picker`)
  - Shows 8 color options
  - Updates preview
- ⏳ **Budget Limit Input** (`input-budget-limit`)
  - Optional number input
  - Only for expense categories
- ⏳ **Save Category Button** (`button-save-category`)
  - Creates category
  - Shows in correct tab
  - Shows success toast

### Edit Category
- ⏳ **Edit Category Button** (`button-edit-category-{id}`)
  - Opens edit dialog with pre-filled data
- ⏳ **Update Category Name**
  - Changes category name
- ⏳ **Update Category Color**
  - Changes color picker selection
- ⏳ **Update Budget Limit**
  - Changes budget amount
- ⏳ **Save Changes Button** (`button-update-category`)
  - Updates category
  - Updates all related transactions
  - Shows success toast

### Delete Category
- ⏳ **Delete Category Button** (`button-delete-category-{id}`)
  - Opens confirmation dialog
- ⏳ **Confirm Delete** (`button-confirm-delete-category`)
  - Removes category
  - Sets related transactions to null category
  - Shows success toast

---

## 5. Income Page Tests

### Month Selector
- ⏳ **Previous Month** (`button-income-prev-month`)
  - Navigates to previous month
- ⏳ **Next Month** (`button-income-next-month`)
  - Navigates to next month

### Income Overview
- ⏳ **Total Income Display** (`text-total-income`)
  - Sums all income transactions for month
- ⏳ **Income by Category**
  - Lists income categories (Salary, Freelance, etc.)
  - Shows amount per category
  - Color-coded indicators

### Add Income
- ⏳ **Add Income Button** (`button-add-income`)
  - Opens add income dialog
- ⏳ **Date Input** (`input-income-date`)
  - Date picker
- ⏳ **Description Input** (`input-income-description`)
  - Text input
- ⏳ **Amount Input** (`input-income-amount`)
  - Number input
- ⏳ **Income Category Select** (`select-income-category`)
  - Shows income categories only
- ⏳ **Save Income Button** (`button-save-income`)
  - Creates income transaction
  - Updates monthly total
  - Shows success toast

### Edit Income
- ⏳ **Edit Income Button** (`button-edit-income-{id}`)
  - Opens edit dialog
- ⏳ **Update Income** (`button-update-income`)
  - Saves changes
  - Updates monthly total

### Delete Income
- ⏳ **Delete Income Button** (`button-delete-income-{id}`)
  - Opens confirmation
- ⏳ **Confirm Delete** (`button-confirm-delete-income`)
  - Removes income transaction

### Recent Income List
- ⏳ **Income Transactions** (`list-income-transactions`)
  - Shows recent income entries
  - Sorted by date descending

---

## 6. Portfolio Page Tests

### Savings Tab
- ⏳ **Savings Tab** (`tab-savings`)
  - Shows savings pots
- ⏳ **Total Savings** (`text-total-savings`)
  - Sums all savings pots

### Add Savings Pot
- ⏳ **Add Savings Button** (`button-add-savings`)
  - Opens create pot dialog
- ⏳ **Pot Name Input** (`input-pot-name`)
  - Text input for pot name
- ⏳ **Initial Amount** (`input-pot-amount`)
  - Number input
- ⏳ **Create Pot Button** (`button-create-pot`)
  - Creates savings pot
  - Updates monthly data
  - Shows success toast

### Adjust Savings
- ⏳ **Add Amount Button** (`button-add-savings-amount-{id}`)
  - Opens quick adjust dialog
- ⏳ **Subtract Amount Button** (`button-subtract-savings-amount-{id}`)
  - Opens quick adjust dialog
- ⏳ **Amount Input** (`input-adjust-amount`)
  - Number input for adjustment
- ⏳ **Confirm Adjustment** (`button-confirm-adjust`)
  - Updates pot amount
  - Updates monthly data
  - Shows success toast

### Edit Pot Amount
- ⏳ **Edit Pot Button** (`button-edit-pot-{id}`)
  - Opens edit dialog
- ⏳ **Set Exact Amount** (`input-edit-pot-amount`)
  - Number input for new amount
- ⏳ **Save Changes** (`button-save-pot-changes`)
  - Updates pot amount
  - Updates monthly data

### Delete Pot
- ⏳ **Delete Pot Button** (`button-delete-pot-{id}`)
  - Opens confirmation dialog
- ⏳ **Confirm Delete** (`button-confirm-delete-pot`)
  - Removes pot
  - Updates monthly data

### Investments Tab
- ⏳ **Investments Tab** (`tab-investments`)
  - Shows investment pots
- ⏳ **Total Investments** (`text-total-investments`)
  - Sums all investment pots
- ⏳ **All Investment Operations**
  - Same as savings operations
  - Separate pot type

---

## 7. Settings Page Tests

### User Account Section
- ⏳ **Username Display** (`text-username`)
  - Shows current username
  - Read-only

### Currency Selection
- ⏳ **Currency Selector** (`select-currency`)
  - Shows 6 currencies (USD, EUR, GBP, JPY, CAD, AUD)
- ⏳ **Currency Change**
  - Updates user settings in database
  - Propagates across all pages
  - Shows correct currency symbol
  - Shows success toast

### Theme Toggle
- ⏳ **Dark Mode Switch** (`switch-theme`)
  - Toggles between light/dark
- ⏳ **Theme Change**
  - Updates user settings in database
  - Applies theme immediately
  - Persists across sessions
  - Shows success toast

### Logout
- ⏳ **Logout Button** (`button-logout`)
  - Clears JWT token
  - Redirects to login page
  - Clears all cached data

---

## 8. Mobile Responsiveness Tests

### Navigation
- ⏳ **Bottom Navigation Bar**
  - Visible on mobile (< 768px)
  - Hidden on desktop (>= 768px)
  - 5 tabs: Dashboard, Transactions, Categories, Income, Portfolio, Settings
  - Active tab highlighting
  - Touch-friendly (min 44x44px)

### Page Layouts
- ⏳ **Dashboard Mobile**
  - Cards stack vertically
  - Charts responsive
  - Touch-friendly buttons
- ⏳ **Transactions Mobile**
  - List view optimized
  - Swipe actions (if implemented)
  - Modal dialogs full-screen
- ⏳ **Categories Mobile**
  - Grid layout responsive
  - Touch-friendly color picker
- ⏳ **Income Mobile**
  - Vertical stacking
  - Easy input fields
- ⏳ **Portfolio Mobile**
  - Pot cards stack
  - Touch-friendly adjustments
- ⏳ **Settings Mobile**
  - List layout
  - Easy switches/selects

### Forms & Inputs
- ⏳ **Input Fields**
  - Proper keyboard types (number, email, date)
  - Comfortable touch targets
  - Labels visible
- ⏳ **Buttons**
  - Minimum 44x44px
  - Clear press states
- ⏳ **Dialogs**
  - Full-screen on mobile
  - Easy to close
  - Scrollable content

---

## 9. Data Integrity Tests

### Transaction Calculations
- ⏳ **Monthly Income Total**
  - Sums all income transactions for month
  - Updates when transactions added/edited/deleted
- ⏳ **Monthly Expenses Total**
  - Sums all expense transactions for month
  - Updates when transactions added/edited/deleted
- ⏳ **Net Income Calculation**
  - Correctly subtracts expenses from income

### Category Learning
- ⏳ **Provider Mapping Creation**
  - Creates mapping when category assigned
  - Stores in category_mappings table
- ⏳ **Auto-Categorization**
  - Uses existing mappings for new transactions
  - Matches provider name
  - Suggests learned category

### Portfolio Tracking
- ⏳ **Monthly Data Updates**
  - Savings changes update monthly_data
  - Investments changes update monthly_data
  - Historical data preserved by month

### Budget Tracking
- ⏳ **Budget Progress**
  - Calculates spending vs budget limit
  - Shows progress percentage
  - Visual indicators (colors)

---

## 10. Error Handling Tests

### Network Errors
- ⏳ **API Failures**
  - Shows error toast
  - Doesn't crash app
  - Allows retry

### Validation Errors
- ⏳ **Form Validation**
  - Shows field-level errors
  - Prevents submission
  - Clear error messages

### Authentication Errors
- ⏳ **Expired Token**
  - Redirects to login
  - Shows session expired message
- ⏳ **Invalid Credentials**
  - Shows error toast
  - Doesn't crash

### Data Errors
- ⏳ **Missing Data**
  - Graceful loading states
  - Empty states with helpful messages
- ⏳ **Invalid Data**
  - Validation prevents save
  - Clear error messaging

---

## 11. Performance Tests

### Loading States
- ⏳ **Query Loading**
  - Shows skeleton/spinner
  - Doesn't block UI
- ⏳ **Mutation Loading**
  - Disables buttons
  - Shows pending state
  - Prevents double-submit

### Cache Invalidation
- ⏳ **Query Invalidation**
  - Refreshes data after mutations
  - Correct queryKey invalidation
  - No stale data

---

## 12. Standalone Vite Setup Tests

### Build Process
- ⏳ **Development Build**
  - `npm run dev` works
  - Hot module replacement
  - No Replit dependencies
- ⏳ **Production Build**
  - `npm run build` completes
  - No Replit plugin errors
  - Generates dist folder
- ⏳ **Production Start**
  - `npm start` works
  - Serves built files
  - API routes work

### Environment Variables
- ⏳ **Required Variables**
  - DATABASE_URL
  - JWT_SECRET
  - BREVO_API_KEY
  - BASE_URL
  - FROM_EMAIL
  - FROM_NAME
- ⏳ **Optional Variables**
  - PORT (defaults to 5000)
  - NODE_ENV (defaults to development)

### Database Setup
- ⏳ **Schema Push**
  - `npm run db:push` works
  - Creates all tables
  - No errors

---

## Summary

**Total Tests**: ~150+ individual test cases
**Current Status**: Testing in progress
**Next Steps**: Complete systematic testing of all features
