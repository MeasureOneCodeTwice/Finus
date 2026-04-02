import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { accountsRouter } from "../src/routes/account.ts";

// mock the database and auth modules
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

// here we import the router and set up the express app after mocking, so that the mocks are used in the router
const app = express();
app.use(express.json());
app.use("/accounts", accountsRouter);

const mockConnection = {
  query: vi.fn(),
  release: vi.fn(),
};

const { pool } = await import("../src/db.ts");
const { authenticateJWT } = await import("../src/utils/auth.ts");
const { checkUserId } = await import("../src/CheckUser.ts");

//reset
beforeEach(() => {
  vi.clearAllMocks();
  pool.getConnection.mockResolvedValue(mockConnection);
});

// POST /accounts

describe("POST /accounts", () => {
  it("returns 400 if name is missing", async () => {
    const res = await request(app)
      .post("/accounts")
      .send({ type: "checking", balance: 100, value: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name is required");
  });

  it("returns 400 if type is missing", async () => {
    const res = await request(app)
      .post("/accounts")
      .send({ name: "Test", balance: 100, value: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Type is required");
  });

  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app)
      .post("/accounts")
      .send({ name: "Test", type: "checking", balance: 100, value: 100 });

    expect(res.status).toBe(401);
  });

  it("returns 404 if profile not found", async () => {
    authenticateJWT.mockReturnValue(1);
    mockConnection.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post("/accounts")
      .send({ name: "Test", type: "checking", balance: 100, value: 100 });

    expect(res.status).toBe(404);
  });
});

// GET /accounts
describe("GET /accounts", () => {
  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app).get("/accounts");

    expect(res.status).toBe(401);
  });

  it("returns 404 if profile not found", async () => {
    authenticateJWT.mockReturnValue(1);
    mockConnection.query.mockResolvedValueOnce([[]]); // no profile rows

    const res = await request(app).get("/accounts");

    expect(res.status).toBe(404);
  });
});

// PUT /accounts
describe("PUT /accounts", () => {
  it("returns 401 if no account is provided", async () => {
    const res = await request(app).put("/accounts").send({});
    expect(res.status).toBe(401);
  });

  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app)
      .put("/accounts")
      .send({ id: 1, name: "x", type: "checking", balance: 10, value: 10 });

    expect(res.status).toBe(401);
  });

  it("returns 401 if user does not own the account", async () => {
    authenticateJWT.mockReturnValue(1);
    checkUserId.mockResolvedValue(false);

    const res = await request(app)
      .put("/accounts")
      .send({ id: 1, name: "x", type: "checking", balance: 10, value: 10 });

    expect(res.status).toBe(401);
  });
});

// DELETE /accounts
describe("DELETE /accounts", () => {
  it("returns 400 if no id is provided", async () => {
    const res = await request(app).delete("/accounts");
    expect(res.status).toBe(400);
  });

  it("returns 401 if JWT fails", async () => {
    authenticateJWT.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app).delete("/accounts?id=1");
    expect(res.status).toBe(401);
  });

  it("returns 401 if user does not own the account", async () => {
    authenticateJWT.mockReturnValue(1);
    checkUserId.mockResolvedValue(false);

    const res = await request(app).delete("/accounts?id=1");

    expect(res.status).toBe(401);
  });
});
