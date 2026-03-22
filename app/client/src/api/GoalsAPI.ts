import type { Goal } from "../types/Goals.ts";
import { instance } from "./config";

async function fetchGoals(): Promise<Goal[]> {
  console.log("fetching goals");
  // const response = await instance.get('/goals/operations');
  // if (response.status !== 200) {
  //     throw new Error(
  //         `Failed to fetch goals data: ${response.statusText}`,
  //     );
  //     }
  // return response.data;
  const newGoal: Goal = {
    id: "1",
    type: "spending_limit",
    category: "New Goal",
    target_amount: 100,
    current_amount: 30,
    period: "monthly",
  };
  return [newGoal];
}

async function createGoal(goal: Partial<Goal>): Promise<Goal> {
  console.log("creating goal: ", goal);
  const response = await instance.post("/goals/operations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goal),
  });
  if (response.status !== 200) {
    throw new Error(`Failed to create goal: ${response.statusText}`);
  }
  return response.data;
}

async function updateGoal(
  goalId: string,
  updates: Partial<Goal>,
): Promise<Goal> {
  console.log("updating goal: ", goalId, updates);
  const response = await instance.patch(`/goals/operations/${goalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (response.status !== 200) {
    throw new Error(`Failed to edit goal: ${response.statusText}`);
  }
  return response.data;
}

async function deleteGoal(goalId: string): Promise<void> {
  console.log("deleting goal: ", goalId);
  const response = await instance.delete(`/goals/operations/${goalId}`, {
    method: "DELETE",
  });
  if (response.status !== 200) {
    throw new Error(`Failed to delete goal: ${response.statusText}`);
  }
}

export { fetchGoals, createGoal, updateGoal, deleteGoal };
