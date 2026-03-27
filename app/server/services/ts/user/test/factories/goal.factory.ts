import type { Goal, CreateGoalInput } from "../../src/types/Goals.ts";

export function createMockGoal(overrides?: Partial<Goal>): Goal {
  return {
    id: 1,
    profile_id: 1,
    name: "Save for Vacation",
    type: "save",
    category: "vacation",
    target: 1000,
    period: "na",
    ...overrides,
  };
}

export function createMockReduceSpendingGoal(overrides?: Partial<Goal>): Goal {
  return {
    id: 2,
    profile_id: 1,
    name: "Reduce Grocery Spending",
    type: "reduce_spending",
    category: "groceries",
    target: 400,
    period: "m",
    ...overrides,
  };
}

export function createMockGoals(count: number = 3): Goal[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    profile_id: 1,
    name: `Goal ${i + 1}`,
    type: i % 2 === 0 ? "save" : "reduce_spending",
    category: i % 2 === 0 ? "vacation" : "groceries",
    target: 500 + i * 100,
    period: i % 2 === 0 ? "na" : "m",
  }));
}

export function createEmptyGoals(): Goal[] {
  return [];
}

export function createMockCreateGoalInput(
  overrides?: Partial<CreateGoalInput>,
): CreateGoalInput {
  return {
    name: "Save for Vacation",
    type: "save",
    category: "travel",
    target: 500,
    period: "m",
    ...overrides,
  };
}
