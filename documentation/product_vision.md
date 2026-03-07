# COMP-4350-Finus Team 6

#### Members:
Roman Tebel, Jackie Mei, Deep Patel, Hoang Huy Truong, Logan Decock, Dylan Prabagaran 

# Project Summary and Vision
Our project provides users with basic personal financial tracking and analytics on a web-based dashboard. 

#### Target Audience
Our project targets users past the age of 16, who are looking to gain better awareness of their financial situation. Because of a broad range, our UI will prioritize intuitive design and meaningful analytics.

#### Core Problem
Financial education varies highly among the general population, and some people find themselves in difficult situations because of their ignorance when it comes to savings and expenditures. 

#### Key Benefit
This project will serve as a means to make users more situationally aware of their finances, and an easier portal to personal finance compared to Excel spreadsheets. Our project would provide the user with everything they would need to get started after a simple interactive setup. This will alleviate the common headache of formatting, processing and visualizing personal finances for the less technical users.

## Core Functional Features
 1. User Authentication. This is a standard sign up and sign in system, which will be implemented via JTW. Our fallback is to rely on cookies should JTW fail.
 2. User Data Input. At the minimum, users will be able to manually input their expenses and savings. Ideally, users would upload CSV files of bank statements, as we can’t get access to an API of any Canadian bank (we’re not a commercial body).
 3. Visualization Dashboard. After processing user data, our app will visualize what users spend their money on and present statistics of their finances over time in various charts.
 4. Financial Goals. Users will be able to declare goals for savings and track them over time.
 5. Projections. With enough data, the app will produce possible outcomes for where users will end up over a period of time. This will visualize compounding savings and how expenses can affect the users long-term.
 6. Stock and FOREX Tracking. By using an open-source library to skim through Yahoo Finance and Oanda API, we will showcase users a minimalized view of the stock and foreign currency exchange markets. Users would be able to search for instruments, pin them, and view their history over time.
 7. Stretch goal: Machine Learning Integration. Through the Python submodule on the server-side, we would boost our projections accuracy and could provide the user recommendations on how they could decrease spendings. With ML, we would also automatically classify user expenses from bank statements.
 8. Stretch goal: Collaborative Budgets. Users would collaborate with other users and combine their expenses/savings for all features.


## Technologies 
 - JTW for user authentication
 - Typescript for all JS.
 - React.js relevant graph libraries for client-side UI in a browser page
 - Node.js for server-side application
 - Express.js for API and some server logic
 - SQLite or MySQL for database
 - Potentially Python for machine learning and heavier data processing on the server.

## User Stories 

### 1. Visualization Dashboard:
#### User Story 1: As a user, I want to see the state of my income, investments, savings and expenses in order to better understand my financial situation.
#### Acceptance Criteria:
 - The user is presented with a dashboard, which contains statistical graphs
 - At least one of the graphs visualizes expenses over time
 - At least one of the graphs visualizes the savings contribution over time
 - At least one of the graphs shows the relationship between total income and where all of that money ends up going

#### User Story 2: As a user, I want to see how I’ve kept up with a proposed budget over a period of time so that I can learn if I need to fix anything about my financial habits. 
#### Acceptance Criteria:
 - Users are proposed a feasible budget plan
 - The budget plan takes into account the user’s income and expenses
 - The budget prioritizes saving money
 - The user is shown how closely they match the budget and whether they overspent within a defined period of time

### 2. User Data Input:
#### User Story 1: As a user, I want multiple ways to input my financial data so that I can explain my financial situation with more precision.
#### Acceptance Criteria:
 - Users can enter data regarding finances manually
 - Users can also enter data regarding finances semi-automatically, by letting the app parse a CSV bank statement
 - Users are able to set up profiles, which incorporate all of their finances
 - Users can create categories for investments, incomes and expenses and assign transactions into those categories
 - When bank statements are parsed, transactions are compared against all the historical transactions within certain categories in order to decide which category they fall under

#### User Story 2: As a user I want to be able to edit transactions in order to correct personal mistakes and ambiguous bank statements.
#### Acceptance Criteria:
 - Users can edit the transaction category for any historical transaction
 - Users can edit the name of any historical transaction
 - Users can edit the financial value associated with any historical transaction

### 3. Projections:
#### User Story 1: As a user who has debt I want to input financial data related to it, and I want to see when I would be able to pay it all off with minimum contributions. I need to know this in order to see what debt I should focus on paying off first.
#### Acceptance Criteria:
 - Users can input various kinds of debt like loans and mortgages
 - Certain kinds of debt have additional input associated with them like amortization
 - Users are presented with a projection of how much they will owe at every specified period of time, given minimum payments

#### User story 2: As a user who wishes to save money, I want to see how my savings will compound over time in various accounts so that I can plan for my future.
#### Acceptance Criteria:
 - Users can input financial information about their savings accounts
 - Users can specify the kind of account they’re using for savings
 - Users are presented with a graph that visualizes how their savings compound over time
 - The projected savings graph shows both worst-case and best-case growth based on historical economic values

### 4.Financial Goals:
#### User Story 1: As a user I want to specify a financial goal such as decreased spending or saving a certain amount of money by a certain date. I need this to keep myself on track with future plans.
#### Acceptance Criteria:
 - User budget is aligned with the selected financial goal
 - User budget recommends changes to user’s financial habits should the user stray away from their financial goal

### 5. User Authentication:
#### User Story 1: As a user I want to create an account so that all my data can be loaded from various supported devices
#### Acceptance Criteria:
 - Users can create an account with an email and a password
 - User data is associated with an account under a certain name
 - Users can log into their account from multiple supported devices (Desktop only)
 - Users can log out of their account, and log in with a different account on the same machine

### 6. Stock and FOREX Tracking:
#### User story 1: As a user I want to view the current state of the stock and the foreign currency exchange markets so that I can learn if certain stocks are performing really well.
#### Acceptance criteria:
 - Users can search for stocks and currency pairs on the dashboard
 - Users can view historical data of a stock or a currency pair
 - Users can pin instruments
 - Pinned instruments always appear on the dashboard with a minimalised view of their historical data

### 7. Stretch goal: Collaborative Budgets:
#### User story 1: As a user who has family and friends, I want to add other profiles under my account so that other people can see their finances and we can make plans together for the future.
#### Acceptance criteria:
 - Users can specify if some of their profiles should be treated as combined
 - Users are presented with a secondary collective budget if they have combined profiles
 - The collaborative budget takes into account multiple profiles
 - The collaborative budget has its own financial goals which it tries to follow

### 8. Stretch goal: Machine Learning Integration:
#### User story 1: As a user I want a more accurate prediction of my finances over time in order to have better situational awareness.
#### Acceptance criteria:
 - Projections for user savings are assisted with statistical ML algorithms
 - Classification of transactions is assisted with classification ML algorithms based on semantic embeddings (through SBERT, as an example)


