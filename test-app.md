# Manual Testing Guide

## Prerequisites
- App running on port 5000
- Browser console open (F12)

## Quick Test Flow

### 1. Authentication
- Register: `testuser1` / `Test123!`
- Login with same credentials
- Test wrong password (should show error)

### 2. Dashboard
- Check month selector works
- Verify stat cards display (Income, Expenses, Savings, Investments)
- View category breakdown and charts

### 3. Transactions
- Add transaction (amount, description, category)
- Upload PDF bank statement
- Edit transaction
- Delete transaction
- Search transactions

### 4. Categories
- Add category (name, icon, color, budget limit)
- Edit category
- Delete category

### 5. Portfolio
- Update savings amount
- Update investments amount
- View historical data

### 6. Settings
- Change currency
- Toggle dark mode
- Logout

## Success Criteria
✅ All CRUD operations work
✅ No console errors
✅ Data persists after refresh
✅ Mobile-friendly interface
✅ All API calls return 200/201

## Common Issues
- **401 Errors:** Check localStorage has token, re-login
- **Components not rendering:** Check console for errors
- **Data not persisting:** Verify database connection