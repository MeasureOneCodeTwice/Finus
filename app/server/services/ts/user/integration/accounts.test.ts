import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createAuthenticatedAccount, createSignupBody } from "./setup";

const BASE_URL = process.env.API_GATEWAY_ADDR;

let token: string;
let accountId: number;

beforeAll(async () => {
  const setup = await createAuthenticatedAccount(BASE_URL, "accounts", {
    name: "Chequing",
    type: "chequing",
    balance: 1000,
    value: 1000,
    subtype: "na",
  });

  token = setup.token;
  accountId = setup.accountId;
}, 30000);

describe("Accounts Integration (Docker)", () => {
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
        type: "chequing",
        balance: 1500,
        value: 1500,
        subtype: "na",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account successfully updated");
  });

  it("prevents unauthorized account updates", async () => {
    const otherUser = createSignupBody("accounts-other");
    otherUser.age = 22;
    otherUser.password = "password123";

    const signup = await request(BASE_URL).post("/api/signup").send(otherUser);
    expect(signup.status).toBe(201);

    const login2 = await request(BASE_URL)
      .post("/api/login")
      .send({ email: otherUser.email, password: otherUser.password });

    expect(login2.status).toBe(200);

    const token2 = login2.body.token;

    const res = await request(BASE_URL)
      .put("/api/accounts")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        id: accountId,
        name: "Hacked Account",
        type: "chequing",
        balance: 9999,
        value: 9999,
        subtype: "na",
      });

    expect(res.status).toBe(401);
  });

  it("deletes an account", async () => {
    const res = await request(BASE_URL)
      .delete(`/api/accounts?id=${accountId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account successfully deleted");
  });

  it("rejects account creation without auth", async () => {
    const res = await request(BASE_URL).post("/api/accounts").send({
      name: "Unauthorized",
      type: "chequing",
    });

    expect(res.status).toBe(400);
  });

  it("validates account input", async () => {
    const res = await request(BASE_URL)
      .post("/api/accounts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "", // invalid
        type: "chequing",
      });

    expect(res.status).toBe(400);
  });
});
