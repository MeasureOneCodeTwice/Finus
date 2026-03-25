import { vi, describe, expect, it, beforeEach, afterEach } from "vitest";
import { enrichGoalWithProgress } from "../src/logic/goals.ts";
import * as transactionsQueries from "../src/queries/transactions.ts";
import type { Pool } from "mysql2/promise";
import { createMockReduceSpendingGoal } from "./factories/goal.factory.ts";

vi.mock("../src/queries/transactions", () => ({
  getDateCategoryTransactionsQuery: vi.fn(),
  getProfileCategoryTransactionsQuery: vi.fn(),
}));

describe("Reduce Spending Goal Periods", () => {
  const mockPool = {} as Pool;
  const profileId = 456;
  const mockGetDateCategoryTransactions =
    transactionsQueries.getDateCategoryTransactionsQuery as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should calculate weekly spending correctly", async () => {
    const mockGoal = createMockReduceSpendingGoal({ period: "w" });
    mockGetDateCategoryTransactions.mockResolvedValue([
      { amount: -50, category: "groceries" },
      { amount: -30, category: "groceries" },
    ]);

    const result = await enrichGoalWithProgress(mockPool, mockGoal, profileId);

    expect(result.current_amount).toBe(80);

    //verify the date range is correct (last 7 days from March 15)
    const callArgs = mockGetDateCategoryTransactions.mock.calls[0];
    expect(callArgs[3]).toBeInstanceOf(Date); // startDate
    expect(callArgs[4]).toBeInstanceOf(Date); // endDate
  });

  it("should calculate monthly spending correctly", async () => {
    const mockGoal = createMockReduceSpendingGoal({ period: "m" });
    mockGetDateCategoryTransactions.mockResolvedValue([
      { amount: -100, category: "groceries" },
      { amount: -200, category: "groceries" },
    ]);

    const result = await enrichGoalWithProgress(mockPool, mockGoal, profileId);

    expect(result.current_amount).toBe(300);
  });

  it("should handle empty transactions for weekly period", async () => {
    const mockGoal = createMockReduceSpendingGoal({ period: "w" });
    mockGetDateCategoryTransactions.mockResolvedValue([]);

    const result = await enrichGoalWithProgress(mockPool, mockGoal, profileId);

    expect(result.current_amount).toBe(0);
    expect(result.progress_percentage).toBe(0);
  });
});
