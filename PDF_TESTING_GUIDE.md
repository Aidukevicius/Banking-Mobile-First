# PDF Upload Testing Guide

## Test File
Use `test_bank_statement.pdf` containing 5 transactions:
1. STARBUCKS - $4.50 (expense)
2. AMAZON - $45.99 (expense)
3. PAYCHECK - $2,500.00 (income)
4. NETFLIX - $15.99 (expense)
5. SHELL - $52.30 (expense)

## Testing Steps

### 1. Create Categories
Create these categories before uploading:
- Coffee & Dining (expense)
- Shopping (expense)
- Income (income)
- Entertainment (expense)
- Transportation (expense)

### 2. First Upload (No Auto-Categorization)
1. Upload `test_bank_statement.pdf`
2. Expected: 5 transactions created, all uncategorized

### 3. Teach the System
Manually categorize each transaction:
- STARBUCKS → Coffee & Dining
- AMAZON → Shopping
- PAYCHECK → Income
- NETFLIX → Entertainment
- SHELL → Transportation

### 4. Test Auto-Categorization
1. Delete all 5 transactions
2. Upload same PDF again
3. Expected: 5 transactions created, all auto-categorized

## How It Works

1. **Provider Extraction:** Extracts provider name from description
2. **Mapping Lookup:** Checks if provider has learned category
3. **Auto-Assignment:** Assigns category if mapping exists
4. **Learning:** Saves mapping when manually categorized

## Verification

✅ PDF parser extracts transactions correctly
✅ First upload creates uncategorized transactions
✅ Manual categorization saves provider mappings
✅ Second upload auto-categorizes based on learned mappings