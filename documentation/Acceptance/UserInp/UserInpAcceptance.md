# Acceptance Criteria

## 1: Manual Financial Entry
- Users can manually enter financial data such as incomes, expenses, investments, and individual transactions.
- Users can input transaction details including name, amount, date, and category.
- Manually entered data appears immediately in the user’s financial profile.

## 2: CSV Import
- Users can upload a CSV bank statement for parsing.
- The system extracts transaction names, dates, amounts, and descriptions.
- Empty or malformed rows are ignored without breaking the import.
- Parsed transactions are displayed for user confirmation before saving.
- Invalid CSV formats return a clear error message.

## 3: Financial Profiles
- Users can create financial profiles that aggregate all accounts, transactions, and categories.
- Profiles persist across sessions.
- Profiles update automatically when new transactions are added manually or via CSV.

## 4: Edit Transactions
- Users can edit the category of any historical transaction.
- Users can edit the name of any historical transaction.
- Users can edit the financial value of any historical transaction.
- Edited transactions update all related summaries and totals.

---

# Acceptance Test Scenarios

## 1 — Manual Entry of Financial Data
Given the user is authenticated  
When they manually enter a new income, expense, or investment  
Then the system stores the entry  
And it appears in their financial profile  

## 2 — CSV Import and Parsing
Given the user uploads a valid CSV bank statement  
When the system parses the file  
Then transactions are extracted and displayed for review  
And invalid rows are ignored without stopping the import  


## 3 — Editing Transaction Category
Given a transaction is incorrectly categorized  
When the user selects a new category  
Then the transaction is updated  
And category totals reflect the change  

## 4 — Editing Transaction Name
Given a transaction name is unclear or incorrect  
When the user edits the name  
Then the updated name appears across all views  

## 5 — Editing Transaction Value
Given a transaction amount is wrong  
When the user edits the value  
Then the corrected value updates account balances and summaries  


