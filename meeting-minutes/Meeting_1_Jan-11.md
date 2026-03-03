**Length of Meeting**: 1 hour

**Attendance:** Everyone - got quorum

Location: Discord 

**Agenda:**

- check‑in
- Project finalization
- Architecture
- Coding conventions
- Branching strategy
- Next steps & assignments

## Discussion:
Minimal discussion was held on topics unrelated to the project.

### Project Description: 
Personal Finance dashboard
### Core Features:

1. Expense visualization and analytics (ML potential here) As is. Pycharts, sankey charts ML is low priority
2. Bank statement parsing (from RBC API as an example) Parsing a bank statement CSV. Classification of expenses (ML potential)
3. Savings projections What happens in the future Saving opportunity recommendations
4. Financial goal setting and tracking Budgeting is part of this
5. User login
6. Stock and FOREX exchange data
7. Collaborative budgets

### Proposed Architecture
Frontend: React
Backend: NodeJS + Python for data processing
DB choice: SQLite/MySQL
schema ideas: TBD


### Coding Conventions

- Naming conventions: Automatic Code formatting (language-specific)
- File structure: Front, Back, Data with interfaces in-between
- Commit message format: `<Main Title>: <Rest of message>

## Branching Strategy

- **Protected Branches:** - main
- **Branch Workflow:** 
	Releases from main. Commits to main from dev branch. Feature branches merged into dev.
    
    - Feature branches naming convention:  Named after feature
        
        - Pull request requirements: None
        - Code review expectations: Someone other than the developer reviews code
### TA meeting: TBD
This should be a meeting just to check if our project idea is feasible.

