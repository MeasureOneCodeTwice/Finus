import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { setupUserWithGoals } from "./setup.ts";
import type { Goal } from "../src/types/Goals.ts";

const BASE_URL = process.env.API_GATEWAY_ADDR;

let token: string;

beforeAll(async () => {
  const setup = await setupUserWithGoals(BASE_URL, "goals-test", [
    {
      name: "Reduce Grocery Spending",
      type: "reduce_spending",
      category: "groceries",
      target: 400,
      period: "m",
    },
    {
      type: "save",
      name: "New Goal",
      category: "Unknown",
      target: 100,
      period: "m",
    },
  ]);
  token = setup.token;
}, 30000);

describe("Goals Integration (Docker)", () => {
  let createdGoalId: number;

  it("creates a new spending reduction goal", async () => {
    const goalData = {
      name: "Reduce Grocery Spending",
      type: "reduce_spending",
      category: "groceries",
      target: 400,
      period: "m",
    };

    const res = await request(BASE_URL)
      .post("/goals")
      .set("Authorization", `Bearer ${token}`)
      .send(goalData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(goalData.name);
    expect(res.body.type).toBe(goalData.type);
    expect(res.body.target).toBe("400.00");
    expect(res.body.period).toBe(goalData.period);

    createdGoalId = res.body.id;
  });

  it("creates a savings goal", async () => {
    const goalData = {
      type: "save",
      name: "New Goal",
      category: "Unknown",
      target: 100,
      period: "m",
    };

    const res = await request(BASE_URL)
      .post("/goals")
      .set("Authorization", `Bearer ${token}`)
      .send(goalData);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(goalData.name);
    expect(res.body.type).toBe(goalData.type);
    expect(res.body.target).toBe("100.00");
  });

  it("lists all goals for the user", async () => {
    const res = await request(BASE_URL)
      .get("/goals")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("updates a goal (using query parameter gid)", async () => {
    const updates = {
      id: createdGoalId,
      name: "Updated Grocery Goal",
      profile_id: 1,
      target: 350,
    };

    const res = await request(BASE_URL)
      .patch(`/goals?gid=${createdGoalId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(updates.name);
    expect(res.body.target).toBe("350.00");
  });

  it("deletes a goal (using query parameter gid)", async () => {
    // Create a temporary goal to delete
    const createRes = await request(BASE_URL)
      .post("/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Temp Goal",
        type: "save",
        category: "temp",
        target: 100,
        period: "m",
      });

    const tempGoalId = createRes.body.id;

    const deleteRes = await request(BASE_URL)
      .delete(`/goals?gid=${tempGoalId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);

    // Verify it's gone - should return 404
    const getRes = await request(BASE_URL)
      .get("/goals")
      .set("Authorization", `Bearer ${token}`);

    const stillExists = getRes.body.some(
      (goal: Goal) => goal.id === tempGoalId,
    );
    expect(stillExists).toBe(false);
  });

  it("respects the 5-goal limit", async () => {
    // First, delete all existing goals to start fresh
    const listRes = await request(BASE_URL)
      .get("/goals")
      .set("Authorization", `Bearer ${token}`);

    for (const goal of listRes.body) {
      const result = await request(BASE_URL)
        .delete(`/goals?gid=${goal.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(result.status).toBe(204);
    }

    const listResPostDelete = await request(BASE_URL)
      .get("/goals")
      .set("Authorization", `Bearer ${token}`);

    expect(listResPostDelete.body.length).toBe(0);

    // Create 5 goals
    for (let i = 0; i < 5; i++) {
      const res = await request(BASE_URL)
        .post("/goals")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: `Goal ${i}`,
          type: "save",
          category: `category${i}`,
          target: 100,
          period: "m",
        });
      expect(res.status).toBe(201);
    }

    // Try to create a 6th
    const res = await request(BASE_URL)
      .post("/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Sixth Goal",
        profile_id: 1,
        type: "save",
        category: "extra",
        target: 100,
        period: "m",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Maximum 5 goals allowed per profile");
  });

  it("rejects goal creation without required fields", async () => {
    // Missing period for reduce_spending
    const res = await request(BASE_URL)
      .post("/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Invalid Goal",
        type: "reduce_spending",
        category: "groceries",
        target: 400,
        // missing period
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("rejects goal creation without auth", async () => {
    const res = await request(BASE_URL).post("/goals").send({
      name: "Unauthorized Goal",
      profile_id: 1,
      type: "save",
      category: "test",
      target: 100,
      period: "m",
    });

    expect(res.status).toBe(401);
  });

  it("rejects update without gid parameter", async () => {
    const res = await request(BASE_URL)
      .patch("/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Should Fail",
      });

    // Without gid, should return 400 or 404
    expect(res.status).toBe(404);
  });

  it("rejects delete without gid parameter", async () => {
    const res = await request(BASE_URL)
      .delete("/goals")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
