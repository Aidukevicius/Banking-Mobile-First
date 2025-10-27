
# Finance Tracker - Manual Test Checklist

## Prerequisites
- App should be running on port 5000
- Browser console should be open (F12) to check for errors

## Test 1: Authentication
### Register New User
1. Open app in browser
2. Click "Sign up" tab
3. Enter username: `testuser1`
4. Enter password: `Test123!`
5. Click "Create Account"
6. **Expected**: Should see dashboard with welcome toast

### Login
1. Logout from settings page
2. Enter username: `testuser1`
3. Enter password: `Test123!`
4. Click "Sign In"
5. **Expected**: Should see dashboard

### Failed Login
1. Try logging in with wrong password
2. **Expected**: Should see error toast

## Test 2: Dashboard
1. Navigate to Dashboard (Home icon)
2. **Expected**: Should see:
   - Month selector at top
   - 4 stat cards (Income, Expenses, Savings, Investments)
   - Categories section
   - Recent transactions section

## Test 3: Transactions
### View Transactions
1. Navigate to Transactions page
2. **Expected**: Should see transaction list or empty state

### Add Transaction
1. Click "Add Transaction" button
2. Fill in:
   - Amount: 50.00
   - Description: Test Coffee
   - Date: Today
   - Type: Expense
   - Category: Select any
3. Click "Add Transaction"
4. **Expected**: New transaction appears in list

### Upload PDF
1. Click "Upload PDF" button
2. Select a bank statement PDF
3. **Expected**: Transactions extracted and added

## Test 4: Categories
### View Categories
1. Navigate to Categories page
2. **Expected**: Should see default categories or empty state

### Add Category
1. Click "Add Category"
2. Enter name: "Test Category"
3. Select an icon
4. Choose a color
5. Click "Add Category"
6. **Expected**: New category appears in list

### Edit Category
1. Click on existing category
2. Change name
3. Click "Save"
4. **Expected**: Category updated

### Delete Category
1. Click on category
2. Click "Delete"
3. Confirm deletion
4. **Expected**: Category removed

## Test 5: Portfolio
### View Portfolio
1. Navigate to Portfolio page
2. **Expected**: Should see Savings and Investments cards

### Update Savings
1. Click edit icon on Savings card
2. Enter new amount: 1000
3. Click "Update"
4. **Expected**: Savings value updated

### Update Investments
1. Click edit icon on Investments card
2. Enter new amount: 2000
3. Click "Update"
4. **Expected**: Investments value updated

## Test 6: Settings
### View Settings
1. Navigate to Settings page
2. **Expected**: Should see:
   - Profile section with username
   - Currency selector
   - Theme toggle
   - Logout button

### Change Currency
1. Click currency dropdown
2. Select "EUR"
3. **Expected**: Currency changes throughout app

### Toggle Theme
1. Click theme toggle
2. **Expected**: App switches between light/dark mode

### Logout
1. Click "Logout" button
2. **Expected**: Redirected to login page

## Test 7: Navigation
1. Click each bottom nav icon
2. **Expected**: Each page loads without errors

## Test 8: Browser Console
Throughout all tests, check browser console (F12):
- **Expected**: No red errors
- API calls should return 200 status codes
- Authentication token should be present in requests

## Common Issues to Check

### Issue: 401 Unauthorized errors
- Check: localStorage has "token" item
- Fix: Login again

### Issue: Components not rendering
- Check: Browser console for errors
- Check: Network tab for failed API calls

### Issue: Data not persisting
- Check: Database file exists in server directory
- Check: API responses include data

### Issue: PDF upload not working
- Check: PDF is a valid bank statement
- Check: File size is reasonable (<10MB)
- Check: Network tab shows successful upload

## API Endpoints to Test (via Browser DevTools Network Tab)

- `POST /api/auth/register` - Should return 200 with user and token
- `POST /api/auth/login` - Should return 200 with user and token
- `GET /api/auth/me` - Should return 200 with user data
- `GET /api/transactions` - Should return 200 with transactions array
- `POST /api/transactions` - Should return 201 with new transaction
- `GET /api/categories` - Should return 200 with categories array
- `POST /api/categories` - Should return 201 with new category
- `GET /api/portfolio` - Should return 200 with portfolio data
- `PUT /api/portfolio/savings` - Should return 200 with updated value
- `GET /api/settings` - Should return 200 with settings
- `PUT /api/settings` - Should return 200 with updated settings

## Success Criteria
✅ All authentication flows work
✅ All CRUD operations work (Create, Read, Update, Delete)
✅ Navigation works smoothly
✅ No console errors
✅ Data persists after page refresh
✅ Theme and currency settings persist
✅ Mobile-friendly interface
