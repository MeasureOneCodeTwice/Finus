# Acceptance Criteria

## 1: Visualization of the user's income, investments and savings
- The user is presented with a dashboard, which contains statistical graphs
- One of the graphs displays a visualization of the user's expenses over time
- One of the graph displays a visualizatoin of the user's saving contributed over time
- One of the graph shows the relationship between the total income and where all of that money ends up going

## 2: Tracking the user's budget goals
- Users are proposed a feasible budget plan
- The budget plan takes into account of the user's income and expenses
- The budget prioritizes saving money
- The user is shown how closely they match the budget and whether they overspent within a defined period of time

---

# Acceptance Test Scenarios

## 1: Seeing a visual of the user's expenses over time
1. Login in or creates a finus account
2. Go to the account list and click on add account
3. Fill out the account form that appeared with any input except with the type: Credit Card subtype: loan.
4. Click create account and observe the account appearing under the account list.
5. Click on create transaction under the transaction list
6. Fill out the transaction form with account that was created as the selected account. Amount has be in the negatives.
7. Repeat step 5-6 until you have have a multiple transaction within this past week and multiple multiple the last month and multiple in different months in the past year.
8. Go top of the dashboard and select expenses if not already selected.
9. Observe if the amount total in each day matches the amount entered in the transactions.
10. Click on month button and checks if total amount each day within a month from now, matches amount that was entered in the transactions.
11. Click on year button and checks if the total amount each month matches the total amount for transactions entered that month

## 2: Seeing a visual of the user's savings over time
1. Login or create a finus account 
2. Go to the account list and click create account
3. Fill out the form and make an account type of savings, other inputs can be anything.
4. Click on create account observe it being added the account list
5. Click on create transaction under transaction list
6. Fill out the transaction form with the newly created account as the selected account.
7. Repeat step 5-6 until you have a multiple transactions thats within the past week, month and year.
8. Go to the first graph in the dashboard, and click on savings if it's not already selected
9. Click on week button and check if savings amount changes matches the transactions that were created within a week from now
10. Click on month button and check if saving amount changes matches the transactions that were created within a month from now
11. Click on year button and check if saving amount changes matches the transactions that were created within a year from now

## 3: Seeing a visual of the user's income over time
1. Login or create a finus account
2. Go to the account list and click create account
3. Fill out the form and make an account type of savings, other inputs can be anything.
4. Click on create account observe it being added the account list
5. Click on create transactions under transaction list
6. Fill out the transaction form with the newly created as the selected account. Use consistent categories for the transaction
7. Repeat step 5-6 until you have multiple transactions thats within the past week, month and year.
8. Go the first graph in the dashboard and click on income flow if its not selected already.
9. Click on week and check if the total amount for a transaction categories on the left side of the graph matches the total of the positive transactions(income) of that category within the past week. 
10. Check if total amount for a transaction category on right matches the total amount the negative transactions(expenses) of that category with in the past week. 
11. Repeat 9 and 10 except for with with month and year, check if transactions with the month/year from now match.

## 4: Tracking if the user is keeping within budget
1. Login or create a finus account
2. Go to the account list and click create account
3. Fill out the form and make an account type of savings, other inputs can be anything
4. Click on create account observe it being added to the account list.
5. Click on create a transaction under transaction list
6. Fill out the transaction form with the newly created account. Create a transactions of the same type.
7. Repeat step 5-6 until you have multiple transactions thats wtihin the past week, month, and year.
8. Go the budget vs expenditure graph and check if the budget amount matches the total amount of possitive transactions and actual spending amount matches the total amount of negative transactions of that type.