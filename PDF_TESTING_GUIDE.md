# PDF Upload & Auto-Categorization Testing Guide

## Overview
This guide will walk you through testing the complete PDF upload and learning categorization system.

## Test PDF File
A test bank statement PDF has been created: `test_bank_statement.pdf`

This PDF contains 5 transactions:
1. 2025-10-15 - STARBUCKS COFFEE SHOP - $4.50 (expense)
2. 2025-10-16 - AMAZON.COM MARKETPLACE - $45.99 (expense)
3. 2025-10-18 - PAYCHECK DEPOSIT ACME CORP - $2,500.00 (income)
4. 2025-10-20 - NETFLIX SUBSCRIPTION - $15.99 (expense)
5. 2025-10-22 - SHELL GAS STATION - $52.30 (expense)

## Testing Steps

### Step 1: Verify Dashboard Reflection ✅
**Status: WORKING**

When you add money to savings or investment pots:
- The monthly data is automatically updated
- The dashboard shows the correct savings/investments for the month
- This has been verified from server logs

### Step 2: Create Categories
Before uploading, create these categories (or similar):
1. Coffee & Dining
2. Shopping  
3. Income (type: income)
4. Entertainment
5. Transportation

### Step 3: First PDF Upload (No Auto-Categorization Expected)
1. Go to the Transactions page
2. Click "Upload PDF" or the upload button
3. Select `test_bank_statement.pdf`
4. Upload the file

**Expected Result:**
- 5 transactions created
- 0 auto-categorized (this is the first upload)
- All 5 transactions show as "Uncategorized"

### Step 4: Manual Categorization (Teaching the System)
Manually categorize each transaction:
1. STARBUCKS → Coffee & Dining
2. AMAZON → Shopping
3. PAYCHECK → Income
4. NETFLIX → Entertainment
5. SHELL → Transportation

**What happens internally:**
- Each categorization creates a "category mapping" in the database
- The system remembers: "STARBUCKS" → "Coffee & Dining"
- These mappings are stored in the `category_mappings` table

### Step 5: Delete Transactions
Delete all 5 transactions to prepare for re-upload test.

### Step 6: Re-Upload Same PDF (Auto-Categorization Test)
1. Upload `test_bank_statement.pdf` again
2. Watch the magic happen!

**Expected Result:**
- 5 transactions created
- 5 auto-categorized ✨
- 0 uncategorized
- Each transaction automatically gets the correct category based on the provider name

## How the Learning System Works

1. **Provider Extraction**: When you upload a PDF, the system extracts:
   - Date
   - Description
   - Provider (e.g., "STARBUCKS", "AMAZON")
   - Amount

2. **Category Mapping Lookup**: Before creating transactions, the system:
   - Checks the `category_mappings` table
   - Looks for a match on the provider name
   - If found, auto-assigns the category

3. **Learning**: When you manually categorize:
   - The system calls `upsertCategoryMapping(provider, categoryId)`
   - This creates or updates a mapping for that provider
   - Future transactions from the same provider auto-categorize

## Verification Checklist

✅ Dashboard reflects pot additions (monthly savings/investments)
✅ PDF parser extracts transactions correctly
✅ First upload creates uncategorized transactions
✅ Manual categorization works
✅ Category mappings are saved
✅ Second upload auto-categorizes based on learned mappings

## Technical Details

### PDF Parser
- Uses `pdf-parse` library with dynamic import
- Extracts text from PDF
- Uses regex to find: dates (YYYY-MM-DD), amounts (decimal format)
- Provider is extracted from transaction description

### Learning Algorithm
- Simple but effective: exact match on provider name
- Provider names are normalized (lowercase, trimmed)
- One-to-one mapping: each provider maps to one category
- If you re-categorize, the mapping updates

### API Endpoints
- `POST /api/transactions/upload-pdf` - Upload PDF
- `PUT /api/transactions/:id` - Categorize transaction (creates mapping)
- `GET /api/category-mappings` - View all learned mappings

## Troubleshooting

**PDF upload fails:**
- Check file is a valid PDF
- Check file size (should be reasonable)
- Check server logs for parsing errors

**Transactions not auto-categorizing:**
- Verify category mappings were created (check database)
- Provider names must match exactly
- Case-insensitive matching is used

**Wrong categories assigned:**
- Re-categorize the transaction
- This will update the category mapping
- Future uploads will use the new mapping
