import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

const BASE_URL = process.env.API_GATEWAY_ADDR;

describe("Authentication Integration (Docker)", () => {
    let email: string;
    let password: string;
    const signupEndpoint = "/api/signup";
    const loginEndpoint = "/api/login";

    beforeAll(() => {
        const unique = `auth${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
        email = `${unique}@example.com`;
        password = "12idontknow";
    });

    it("signs up a new user", async () => {
        const signupBody = {
            username: "anything",
            email: email,
            first_name: "Auth",
            last_name: "Test",
            age: 40,
            password: password,
        }
        console.log("Signup body:", signupBody);
        const res = await request(BASE_URL)
              .post(signupEndpoint)
              .send(signupBody)
        
        
        expect(res.status).toBe(201);
    });

    it("failed signup due to duplicate email", async () => {
        const signupBody = {
            username: "anything",
            email: email,
            first_name: "Auth",
            last_name: "Test",
            age: 40,
            password: "12idontknow",
        }
        const res = await request(BASE_URL)
              .post(signupEndpoint)
              .send(signupBody)
        
        expect(res.status).toBe(409);
        expect(res.body.error).toBe("An account with this email already exists.");
    });

    it("failed signup due to invalid email format", async () => {
        const signupBody = {
            username: "anything",
            email: "invalidemail",
            first_name: "Auth",
            last_name: "Test",
            age: 40,
            password: "12idontknow",
        }
        const res = await request(BASE_URL)
              .post(signupEndpoint)
              .send(signupBody)
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("invalid email format");
    });

    it("failed signup due to invalid password", async () => {
        const signupBody = {
            username: "anything",
            email: "newaccount@example.com",
            first_name: "Auth",
            last_name: "Test",
            age: 40,
            password: "short",
        }
        const res = await request(BASE_URL)
              .post(signupEndpoint)
              .send(signupBody)
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Password must be at least 8 characters and include letters and numbers.");
    });

    it("failed signup due to under age", async () => {
        const signupBody = {
            username: "anything",
            email: "newaccount@example.com",
            first_name: "Auth",
            last_name: "Test",
            age: 15,
            password: "longenoughpassword1",
        }
        const res = await request(BASE_URL)
              .post(signupEndpoint)
              .send(signupBody)
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Age must be a whole number between 16 and 120");
    });

    it("failed signup due to over age", async () => {
        const signupBody = {
            username: "anything",
            email: "newaccount@example.com",
            first_name: "Auth",
            last_name: "Test",
            age: 121,
            password: "longenoughpassword1",
        }
        const res = await request(BASE_URL)
              .post(signupEndpoint)
              .send(signupBody)
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Age must be a whole number between 16 and 120");
    });

    it("logs in an existing user", async () => {
        const loginBody = {
            email: email,
            password: password,
        }
        const res = await request(BASE_URL)
              .post(loginEndpoint)
              .send(loginBody)
        
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it("logs in with wrong password", async () => {
        const loginBody = {
            email: email,
            password: "wrongpassword",
        }
        const res = await request(BASE_URL)
              .post(loginEndpoint)
              .send(loginBody)
        
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Invalid email or password.");
    });

    it("logs into non existing account", async () => {
        const loginBody = {
            email: "nonexist@exmaple.com",
            password: "bskdfks312",
        }
        const res = await request(BASE_URL)
              .post(loginEndpoint)
              .send(loginBody)
        
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Invalid email or password.");
    });

    it("logs in with empty credentials", async () => {
        const loginBody = {
            email: "",
            password: "",
        }
        const res = await request(BASE_URL)
              .post(loginEndpoint)
              .send(loginBody)
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Missing email");
    });
});