import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";


const BASE_URL = process.env.APP_URL!;

let token: string;
let accountId: number;

beforeAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Create test user
  await request(BASE_URL)
    .post("/api/signup")
    .send({ email: "test@example.com", password: "password123" });

  // Login
  const login = await request(BASE_URL)
    .post("/api/login")
    .send({ email: "test@example.com", password: "password123" });

  token = login.body.token;
});

describe("Accounts Integration (Docker)", () => {
  it("creates an account", async () => {
    const res = await request(BASE_URL)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Chequing",
        type: "bank",
        balance: 1000,
        value: 1000,
        subtype: "personal",
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();

    accountId = res.body.id;
  });

  it("lists accounts for the authenticated user", async () => {
    const res = await request(BASE_URL)
      .get("/api/accounts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("updates an account", async () => {
    const res = await request(BASE_URL)
      .put("/api/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: accountId,
        name: "Updated Chequing",
        type: "bank",
        balance: 1500,
        value: 1500,
        subtype: "personal",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account successfully updated");
  });

  it("prevents unauthorized account updates", async () => {
    // Create second user
    await request(BASE_URL)
      .post("/api/signup")
      .send({ email: "other@example.com", password: "password123" });

    const login2 = await request(BASE_URL)
      .post("/api/login")
      .send({ email: "other@example.com", password: "password123" });

    const token2 = login2.body.token;

    const res = await request(BASE_URL)
      .put("/api/accounts")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        id: accountId,
        name: "Hacked Account",
        type: "bank",
        balance: 9999,
        value: 9999,
        subtype: "fraud",
      });

    expect(res.status).toBe(401);
  });

  it("deletes an account", async () => {
    const res = await request(BASE_URL)
      .delete("/api/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: accountId });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account successfully deleted");
  });

  it("rejects account creation without auth", async () => {
    const res = await request(BASE_URL)
      .post("/api/accounts")
      .send({
        name: "Unauthorized",
        type: "bank",
      });

    expect(res.status).toBe(404);
  });

  it("validates account input", async () => {
    const res = await request(BASE_URL)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "", // invalid
        type: "bank",
      });

    expect(res.status).toBe(404);
  });
});
