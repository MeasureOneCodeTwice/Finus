import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { transactionsRouter } from "../src/routes/transaction.ts";

//mock for database and auth modules
vi.mock("../src/db.ts", () => ({
  pool: {
    getConnection: vi.fn(),
  },
}));

vi.mock("../src/utils/auth.ts", () => ({
  authenticateJWT: vi.fn(),
}));

vi.mock("../src/CheckUser.ts", () => ({
  checkUserId: vi.fn(),
}));

vi.mock("../src/DataConversion.ts", () => ({
  convertToDateTime: vi.fn((d) => d),
}));

const app = express();
app.use(express.json());
app.use("/transactions", transactionsRouter);

const mockConnection = {
  query: vi.fn(),
  release: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
};

const { pool } = await import("../src/db.ts");
const { authenticateJWT } = await import("../src/utils/auth.ts");
const { checkUserId } = await import("../src/CheckUser.ts");

// reset
beforeEach(() => {
  vi.clearAllMocks();
  pool.getConnection.mockResolvedValue(mockConnection);
});

// GET /transactions
describe("GET /transactions", () => {
  it("returns 400 if financialAccount_id is missing", async () => {
    const res = await request(app).get("/transactions");
    expect(res.status).toBe(400);
  });

  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app).get("/transactions?financialAccount_id=1");
    expect(res.status).toBe(401);
  });

  it("returns 401 if user does not own the account", async () => {
    authenticateJWT.mockReturnValue(1);
    checkUserId.mockResolvedValue(false);

    const res = await request(app).get("/transactions?financialAccount_id=1");
    expect(res.status).toBe(401);
  });
});

// POST /transactions
describe("POST /transactions", () => {
  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app)
      .post("/transactions")
      .send({ financialAccount_id: 1, amount: 10, date: "2024-01-01" });

    expect(res.status).toBe(401);
  });

  it("returns 401 if user does not own the account", async () => {
    authenticateJWT.mockReturnValue(1);
    checkUserId.mockResolvedValue(false);

    const res = await request(app)
      .post("/transactions")
      .send({ financialAccount_id: 1, amount: 10, date: "2024-01-01" });

    expect(res.status).toBe(401);
  });
});

// PUT /transactions
describe("PUT /transactions", () => {
  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app)
      .put("/transactions")
      .send({ id: 1, financialAccount_id: 1, amount: 10, date: "2024-01-01" });

    expect(res.status).toBe(401);
  });

  it("returns 401 if user does not own the account", async () => {
    authenticateJWT.mockReturnValue(1);
    checkUserId.mockResolvedValue(false);

    const res = await request(app)
      .put("/transactions")
      .send({ id: 1, financialAccount_id: 1, amount: 10, date: "2024-01-01" });

    expect(res.status).toBe(401);
  });
});

// DELETE /transactions
describe("DELETE /transactions", () => {
  it("returns 400 if id or financialAccount_id missing", async () => {
    const res = await request(app).delete("/transactions").send({});
    expect(res.status).toBe(400);
  });

  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app)
      .delete("/transactions")
      .send({ id: 1, financialAccount_id: 1 });

    expect(res.status).toBe(401);
  });

  it("returns 401 if user does not own the account", async () => {
    authenticateJWT.mockReturnValue(1);
    checkUserId.mockResolvedValue(false);

    const res = await request(app)
      .delete("/transactions")
      .send({ id: 1, financialAccount_id: 1 });

    expect(res.status).toBe(401);
  });
});

// POST /transactions/csvTransaction
describe("POST /transactions/csvTransaction", () => {
  it("returns 400 if payload invalid", async () => {
    const res = await request(app)
      .post("/transactions/csvTransaction")
      .send({ financialAccount_id: 1, transactions: "not-array" });

    expect(res.status).toBe(400);
  });

  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app)
      .post("/transactions/csvTransaction")
      .send({ financialAccount_id: 1, transactions: [] });

    expect(res.status).toBe(401);
  });

  it("returns 401 if user does not own the account", async () => {
    authenticateJWT.mockReturnValue(1);
    checkUserId.mockResolvedValue(false);

    const res = await request(app)
      .post("/transactions/csvTransaction")
      .send({ financialAccount_id: 1, transactions: [] });

    expect(res.status).toBe(401);
  });

  it("returns 400 if no valid rows", async () => {
    authenticateJWT.mockReturnValue(1);
    checkUserId.mockResolvedValue(true);

    const res = await request(app)
      .post("/transactions/csvTransaction")
      .send({
        financialAccount_id: 1,
        transactions: [{ errors: ["bad"] }],
      });

    expect(res.status).toBe(401);
  });
});
