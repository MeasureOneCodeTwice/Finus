import type { Goal } from "../types/Goals.ts";
import { instance } from "./config";

async function fetchGoals(): Promise<Goal[]> {
  console.log("fetching goals");
  const response = await instance.get('/goals');
  if (response.status !== 200) {
    throw new Error(`Failed to fetch goals data: ${response.statusText}`);
  }
  console.log('returning a list of goals: ', response.data);
  return response.data;
}

async function createGoal(goal: Partial<Goal>): Promise<Goal> {
  console.log("creating goal: ", goal);
  const response = await instance.post("/goals", goal);
  if (response.status !== 201) {  // 201 Created is standard for POST
    throw new Error(`Failed to create goal: ${response.statusText}`);
  }
  return response.data;
}

async function updateGoal(
  goalId: string,
  updates: Partial<Goal>,
): Promise<Goal> {
  const response = await instance.patch(`/goals?gid=${goalId}`, updates);
  if (response.status !== 200) {
    throw new Error(`Failed to edit goal: ${response.statusText}`);
  }
  console.log("updated goal: ", response.data);
  return response.data;
}

async function deleteGoal(goalId: string): Promise<void> {
  console.log("deleting goal: ", goalId);
  const response = await instance.delete(`/goals?gid=${goalId}`);
  if (response.status !== 204) {  // 204 No Content is standard for DELETE
    throw new Error(`Failed to delete goal: ${response.statusText}`);
  }
}

export { fetchGoals, createGoal, updateGoal, deleteGoal };