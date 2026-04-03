# Acceptance Criteria

## 1: Debt Deadlines
- User can input various kinds of debt like loans
- Certain kinds of debt have additional inputs associated with them, like a amortization
- User are presetned with a projection of how much they will owe at every specific period of time, givne minimum payments.

## 2: Savings compound overtime
- User can input financial information about their savings accounts
- users can specify the kind of account they're using for savings
- User are presented with a graph that visualizes how their savings compound over time
- The projected savings graph shows both worst-case and best-case growth based on historical economic values.

---

# Acceptance Test Scanario

## 1: Seeing a projection of the user's savings account growth
1. Sign in or create a finus account
2. Create an financial account of savings type
3. Go to the projection page by clicking top left button and then clicking projection
4. Select the saving projection button if not selected already.
5. Select the saving account that was just created.
6. Fill out the rest of the form in saving account detail then click on calculate projection
7. Go to the saving growth projection, you should see a graph with 3 different lines, green being a best case(optimistic), yellow being expected case, and red being worst case(conservative). They best case should show the highest amount in their projection followed up by expected and then worst case.

## 2: Seeing a projection of how long and how much it would take to pay off a debt
1. Sign in or create a finus account
2. Go to account list and create an account of type Credit Card with subtype loan. 
3. Go to the projection page by clicking on the top left and clicking projection.
4. Click on Debt payoff projection if not selected already.
5. Select the account that we created and fill out the rest of the form then click on calculate projections.
6. Go the debt payoff schedule and you will see a line of amount of debt remaining in future payment deadlines.
7. Right bellow the graph, you can see how much interest you paid in total.