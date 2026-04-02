# Load Testing

This folder contains the `k6` capacity test for the backend.

The main script is `api-gateway-capacity.js`.

It validates the course capacity requirement by simulating:

- `20` concurrent users
- `200` total requests per minute

How it works:

- Each virtual user signs up and logs in with a unique test account.
- Each virtual user creates one account and one starter transaction.
- After setup, each virtual user sends `10` authenticated requests per minute.
- `20` users x `10` requests per minute = `200` requests per minute total.

How to run it:

```bash
cd app/server
docker compose up -d
docker compose -f docker-compose.test.yml up load-test --abort-on-container-failure
```
