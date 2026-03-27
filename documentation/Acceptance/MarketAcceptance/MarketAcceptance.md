## Acceptance Criteria 
1: Search
Searching “AAPL” returns Apple stock.
Searching “USD/CAD” returns the forex pair.
Empty search returns no results.
Invalid symbols return an empty list.

2: Market Data
GET /market/AAPL returns:

- price
- daily change
- timestamp

3: Historical Data
GET /market/=AAPL&range=1M returns:
an array of  price points
no gaps in chart data
missing days filled with the last known value

4: Pinning
POST /user/pins stores a pin.
GET /user/pins returns all pinned instruments.
Duplicate pins are rejected.

5: Unpinning
DELETE /user/pins/:symbol removes the pin.

6: Sync on Login
After login, pinned instruments appear on the dashboard automatically.

## Acceptance Test Scenarios
1 — Search for an Instrument
Given the user is authenticated
When they search for “AAPL”  
Then the system returns a list containing Apple stock

2 — View Market Quote
Given the user selects “AAPL”  
When they open the instrument page
Then the system shows current price and daily change

3 — View Historical Chart
Given the user selects “AAPL”  
When they choose the 1‑month range
Then the system displays a chart with normalized data

4 — Pin an Instrument
Given the user is authenticated
When they pin “AAPL”  
Then the pin appears in their profile

5 — Sync Pins on Login
Given the user has pinned “AAPL”  
When they log in
Then the dashboard shows “AAPL”

6 — Unpin an Instrument
Given the user has pinned “AAPL”  
When they unpin it
Then it is removed from their profile