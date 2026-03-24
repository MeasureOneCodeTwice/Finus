import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

const BASE_URL = "http://localhost:3000";

let token: string;
let accountId: number;

beforeAll(async () => {
  const accountDetails = {
    username: "hi@hi.com",
    email: "hi@hi.com",
    first_name: "logan",
    last_name: "also logan",
    age: 30,
    password: "123ABC!7",
  };

  const result = await request(BASE_URL)
    .post("/api/signup")
    .send(accountDetails);
  console.log(JSON.stringify(result.body, null, 2));

  const login = await request(BASE_URL)
    .post("/api/login")
    .send({ email: accountDetails.email, password: accountDetails.password });

  token = login.body.token;

  console.log(JSON.stringify(login.body, null, 2));

  const account = await request(BASE_URL)
    .post("/api/accounts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "all my moola",
      type: "chequing",
      balance: 1000,
      value: 1000,
      subtype: "TFSA",
    });

  accountId = account.body.id;
});

describe("Transactions Integration (Docker)", () => {
  it("creates a transaction", async () => {
    const res = await request(BASE_URL)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        financialAccount_id: accountId,
        amount: 50,
        description: "Groceries",
        sender: "Me",
        recipient: "Store",
        date: "2024-01-01T12:00:00",
        category: "Food",
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  it("lists transactions for an account", async () => {
    // Create a transaction first
    await request(BASE_URL)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        financialAccount_id: accountId,
        amount: 20,
        description: "Coffee",
        sender: "Me",
        recipient: "Cafe",
        date: "2024-01-02T10:00:00",
        category: "Food",
      });

    const res = await request(BASE_URL)
      .get(`/api/transactions?financialAccount_id=${accountId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("updates a transaction", async () => {
    // Create a transaction
    const create = await request(BASE_URL)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        financialAccount_id: accountId,
        amount: 10,
        description: "Snack",
        sender: "Me",
        recipient: "Vending",
        date: "2024-01-03T09:00:00",
        category: "Food",
      });

    const id = create.body.id;

    const update = await request(BASE_URL)
      .put("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id,
        financialAccount_id: accountId,
        amount: 15,
        description: "Snack Updated",
        sender: "Me",
        recipient: "Vending",
        date: "2024-01-03T09:30:00",
      });

    expect(update.status).toBe(200);
    expect(update.body.message).toBe("Transaction successfully updated");
  });

  it("deletes a transaction", async () => {
    // Create a transaction
    const create = await request(BASE_URL)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        financialAccount_id: accountId,
        amount: 100,
        description: "Test",
        sender: "Me",
        recipient: "Someone",
        date: "2024-01-04T12:00:00",
        category: "Misc",
      });

    const id = create.body.id;

    const del = await request(BASE_URL)
      .delete("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ id, financialAccount_id: accountId });

    expect(del.status).toBe(200);
    expect(del.body.message).toBe("Transaction deleted");
  });

  it("imports CSV transactions", async () => {
    const res = await request(BASE_URL)
      .post("/api/transactions/csvTransaction")
      .set("Authorization", `Bearer ${token}`)
      .send({
        financialAccount_id: accountId,
        transactions: [
          {
            amount: 12.5,
            description: "Lunch",
            sender: "Me",
            recipient: "Restaurant",
            date: "2024-01-05T13:00:00",
            category: "Food",
            errors: [],
          },
          {
            amount: null,
            description: null,
            date: null,
            errors: ["Missing amount"],
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(1);
    expect(res.body.skipped).toBe(1);
    expect(res.body.transactions.length).toBe(1);
  });

  it("rejects unauthorized access", async () => {
    const res = await request(BASE_URL).post("/api/transactions").send({
      financialAccount_id: accountId,
      amount: 10,
      date: "2024-01-01T12:00:00",
    });

    expect(res.status).toBe(404);
  });
});
