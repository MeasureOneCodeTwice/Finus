// tests/logic/goals.test.ts
import { vi, describe, expect, it, beforeEach } from "vitest";
import {
  getGoalsByProfileId,
  getUserGoals,
  getUserGoalById,
  createUserGoal,
  updateUserGoal,
  deleteUserGoal,
  enrichGoalWithProgress,
} from "../src/logic/goals.ts";
import * as goalsQueries from "../src/queries/goals.ts";
import * as transactionsQueries from "../src/queries/transactions.ts";
import * as goalsLogic from "../src/logic/goals.ts";

import type { Pool } from "mysql2/promise";
import {
  createMockGoal,
  createMockReduceSpendingGoal,
  // createMockGoalWithProgress,
  createMockGoals,
  createEmptyGoals,
  createMockCreateGoalInput,
} from "./factories/goal.factory.ts";
import type { Goal, GoalType, GoalWithProgress } from "../src/types/Goals.ts";

vi.mock("../src/queries/goals", () => ({
  getUserProfileId: vi.fn(),
  getGoalsByProfileId: vi.fn(),
  getGoalById: vi.fn(),
  getGoalCountByProfileId: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

vi.mock("../src/queries/transactions", () => ({
  getDateCategoryTransactionsQuery: vi.fn(),
  getProfileCategoryTransactionsQuery: vi.fn(),
}));

describe("Goals Logic", () => {
  const mockPool = {} as Pool;
  const userId = 123;
  const profileId = 1;
  const goalId = 1;

  const mockGetUserProfileId = goalsQueries.getUserProfileId as vi.Mock;
  const mockGetGoalsByProfileId = goalsQueries.getGoalsByProfileId as vi.Mock;
  const mockGetGoalById = goalsQueries.getGoalById as vi.Mock;
  const mockGetGoalCountByProfileId =
    goalsQueries.getGoalCountByProfileId as vi.Mock;
  const mockCreateGoal = goalsQueries.createGoal as vi.Mock;
  const mockUpdateGoal = goalsQueries.updateGoal as vi.Mock;
  const mockDeleteGoal = goalsQueries.deleteGoal as vi.Mock;
  const mockGetDateCategoryTransactions =
    transactionsQueries.getDateCategoryTransactionsQuery as vi.Mock;
  const mockGetProfileCategoryTransactions =
    transactionsQueries.getProfileCategoryTransactionsQuery as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getUserGoals", () => {
    it("should return enriched goals for a user", async () => {
      const mockGoals = createMockGoals(2);
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalsByProfileId.mockResolvedValue(mockGoals);

      //mock transactions for progress calculation
      mockGetProfileCategoryTransactions.mockResolvedValue([
        { amount: 100, category: "vacation" },
        { amount: 150, category: "vacation" },
      ]);
      mockGetDateCategoryTransactions.mockResolvedValue([]);

      const result = await getUserGoals(mockPool, userId);

      expect(result).toHaveLength(2);
      expect(result[0].current_amount).toBeDefined();
      expect(result[0].progress_percentage).toBeDefined();
      expect(mockGetUserProfileId).toHaveBeenCalledWith(mockPool, userId);
      expect(mockGetGoalsByProfileId).toHaveBeenCalledWith(mockPool, profileId);
    });

    it("should return empty array when no profile found", async () => {
      mockGetUserProfileId.mockResolvedValue(null);

      const result = await getUserGoals(mockPool, userId);

      expect(result).toEqual([]);
      expect(mockGetGoalsByProfileId).not.toHaveBeenCalled();
    });

    it("should return empty array when no goals found", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalsByProfileId.mockResolvedValue(createEmptyGoals());

      const result = await getUserGoals(mockPool, userId);

      expect(result).toEqual([]);
    });
  });

  describe("getUserGoalById", () => {
    it("should return enriched goal by id", async () => {
      const mockGoal = createMockGoal();
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalById.mockResolvedValue(mockGoal);
      mockGetProfileCategoryTransactions.mockResolvedValue([
        { amount: 100, category: "vacation" },
      ]);

      const result = await getUserGoalById(mockPool, goalId, userId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(goalId);
      expect(result?.current_amount).toBeDefined();
      expect(mockGetUserProfileId).toHaveBeenCalledWith(mockPool, userId);
      expect(mockGetGoalById).toHaveBeenCalledWith(mockPool, goalId, profileId);
    });

    it("should return null when no profile found", async () => {
      mockGetUserProfileId.mockResolvedValue(null);

      const result = await getUserGoalById(mockPool, goalId, userId);

      expect(result).toBeNull();
    });

    it("should return null when goal not found", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalById.mockResolvedValue(null);

      const result = await getUserGoalById(mockPool, goalId, userId);

      expect(result).toBeNull();
    });
  });

  describe("createUserGoal", () => {
    const createInput = createMockCreateGoalInput();

    const createdGoal = {
      ...createInput,
      id: goalId,
      current_amount: 0,
      progress_percentage: 0,
    };

    it("should create a new goal successfully", async () => {
      // const mockNewGoal = createMockGoal();
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalCountByProfileId.mockResolvedValue(2);
      mockCreateGoal.mockResolvedValue(createdGoal);
      mockGetProfileCategoryTransactions.mockResolvedValue([]);

      const result = await createUserGoal(mockPool, userId, createInput);

      expect(result).toBeDefined();
      expect(result.name).toBe(createInput.name);
      expect(mockCreateGoal).toHaveBeenCalledWith(
        mockPool,
        profileId,
        createInput,
      );
      expect(mockGetGoalCountByProfileId).toHaveBeenCalledWith(
        mockPool,
        profileId,
      );
    });

    it("should throw error when profile not found", async () => {
      mockGetUserProfileId.mockResolvedValue(null);

      await expect(
        createUserGoal(mockPool, userId, createInput),
      ).rejects.toThrow("User profile not found");
    });

    it("should throw error when max goals reached", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalCountByProfileId.mockResolvedValue(5);

      await expect(
        createUserGoal(mockPool, userId, createInput),
      ).rejects.toThrow("Maximum 5 goals allowed per profile");
    });

    it("should throw error when goal name is empty", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalCountByProfileId.mockResolvedValue(2);
      const invalidInput = { ...createInput, name: "   " };

      await expect(
        createUserGoal(mockPool, userId, invalidInput),
      ).rejects.toThrow("Goal name is required");
    });

    it("should throw error when target is zero or negative", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalCountByProfileId.mockResolvedValue(2);
      const invalidInput = { ...createInput, target: 0 };

      await expect(
        createUserGoal(mockPool, userId, invalidInput),
      ).rejects.toThrow("Target amount must be greater than 0");
    });

    it("should throw error when reduce_spending goal has no category", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalCountByProfileId.mockResolvedValue(2);
      const invalidInput = {
        ...createInput,
        type: "reduce_spending" as GoalType,
        category: "",
      };

      await expect(
        createUserGoal(mockPool, userId, invalidInput),
      ).rejects.toThrow("Spending limit goals require a category");
    });
  });

  describe("updateUserGoal", () => {
    const updates = { name: "Updated Goal", target: 2000 };

    it("should update a goal successfully", async () => {
      const existingGoal = createMockGoal();
      const updatedGoal = { ...existingGoal, ...updates };
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalById.mockResolvedValue(existingGoal);
      mockUpdateGoal.mockResolvedValue(updatedGoal);
      mockGetProfileCategoryTransactions.mockResolvedValue([]);

      const result = await updateUserGoal(mockPool, goalId, userId, updates);

      expect(result).toBeDefined();
      expect(result.name).toBe(updates.name);
      expect(result.target).toBe(updates.target);
      expect(mockUpdateGoal).toHaveBeenCalledWith(
        mockPool,
        goalId,
        profileId,
        updates,
      );
    });

    it("should throw error when profile not found", async () => {
      mockGetUserProfileId.mockResolvedValue(null);

      await expect(
        updateUserGoal(mockPool, goalId, userId, updates),
      ).rejects.toThrow("User profile not found");
    });

    it("should throw error when goal not found", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalById.mockResolvedValue(null);

      await expect(
        updateUserGoal(mockPool, goalId, userId, updates),
      ).rejects.toThrow("Goal not found");
    });

    it("should throw error when target is zero or negative", async () => {
      const existingGoal = createMockGoal();
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalById.mockResolvedValue(existingGoal);
      const invalidUpdates = { target: 0 };

      await expect(
        updateUserGoal(mockPool, goalId, userId, invalidUpdates),
      ).rejects.toThrow("Target amount must be greater than 0");
    });

    it("should throw error when updateGoal returns null", async () => {
      const existingGoal = createMockGoal();
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockGetGoalById.mockResolvedValue(existingGoal);
      mockUpdateGoal.mockResolvedValue(null); // Simulate failed update

      await expect(
        updateUserGoal(mockPool, goalId, userId, updates),
      ).rejects.toThrow("Failed to update goal");
    });
  });

  describe("deleteUserGoal", () => {
    it("should delete a goal successfully", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockDeleteGoal.mockResolvedValue(true);

      const result = await deleteUserGoal(mockPool, goalId, userId);

      expect(result).toBe(true);
      expect(mockDeleteGoal).toHaveBeenCalledWith(mockPool, goalId, profileId);
    });

    it("should throw error when profile not found", async () => {
      mockGetUserProfileId.mockResolvedValue(null);

      await expect(deleteUserGoal(mockPool, goalId, userId)).rejects.toThrow(
        "User profile not found",
      );
    });

    it("should throw error when goal not found", async () => {
      mockGetUserProfileId.mockResolvedValue(profileId);
      mockDeleteGoal.mockResolvedValue(false);

      await expect(deleteUserGoal(mockPool, goalId, userId)).rejects.toThrow(
        "Goal not found or already deleted",
      );
    });
  });

  describe("enrichGoalWithProgress", () => {
    it("should enrich a save goal with progress from savings transactions", async () => {
      const mockGoal = createMockGoal();
      mockGetProfileCategoryTransactions.mockResolvedValue([
        { amount: 100, category: "vacation" },
        { amount: 150, category: "vacation" },
      ]);

      const result = await enrichGoalWithProgress(
        mockPool,
        mockGoal,
        profileId,
      );

      expect(result.current_amount).toBe(250);
      expect(result.progress_percentage).toBe(25); // 250/1000 * 100
      expect(mockGetProfileCategoryTransactions).toHaveBeenCalledWith(
        mockPool,
        profileId,
        mockGoal.category,
      );
    });

    it("should enrich a reduce_spending goal with progress from expenses", async () => {
      const mockGoal = createMockReduceSpendingGoal();
      mockGetDateCategoryTransactions.mockResolvedValue([
        { amount: -100, category: "groceries" },
        { amount: -150, category: "groceries" },
      ]);

      const result = await enrichGoalWithProgress(
        mockPool,
        mockGoal,
        profileId,
      );

      expect(result.current_amount).toBe(250);
      expect(result.progress_percentage).toBe(62.5); // 250/400 * 100
      expect(mockGetDateCategoryTransactions).toHaveBeenCalledWith(
        mockPool,
        profileId,
        mockGoal.category,
        expect.any(Date),
        expect.any(Date),
      );
    });

    it("should cap progress at 100%", async () => {
      const mockGoal = createMockGoal({ target: 200 });
      mockGetProfileCategoryTransactions.mockResolvedValue([
        { amount: 300, category: "vacation" },
      ]);

      const result = await enrichGoalWithProgress(
        mockPool,
        mockGoal,
        profileId,
      );

      expect(result.current_amount).toBe(300);
      expect(result.progress_percentage).toBe(100); // capped at 100
    });

    it("should return 0 current amount when no transactions", async () => {
      const mockGoal = createMockGoal();
      mockGetProfileCategoryTransactions.mockResolvedValue([]);

      const result = await enrichGoalWithProgress(
        mockPool,
        mockGoal,
        profileId,
      );

      expect(result.current_amount).toBe(0);
      expect(result.progress_percentage).toBe(0);
    });

    it("should handle negative totals for save goals (more expenses than savings)", async () => {
      const mockGoal = createMockGoal();
      mockGetProfileCategoryTransactions.mockResolvedValue([
        { amount: 100, category: "vacation" },
        { amount: -300, category: "vacation" }, // negative transaction (expense)
      ]);

      const result = await enrichGoalWithProgress(
        mockPool,
        mockGoal,
        profileId,
      );

      expect(result.current_amount).toBe(0); // total is -200, should return 0
    });
  });

  describe("getGoalsByProfileId", () => {
    it("should return goals for a profile", async () => {
      const mockGoals = createMockGoals(3);
      mockGetGoalsByProfileId.mockResolvedValue(mockGoals);

      const result = await getGoalsByProfileId(mockPool, profileId);

      expect(result).toHaveLength(3);
      expect(mockGetGoalsByProfileId).toHaveBeenCalledWith(mockPool, profileId);
    });

    it("should return empty array when no goals", async () => {
      mockGetGoalsByProfileId.mockResolvedValue([]);

      const result = await getGoalsByProfileId(mockPool, profileId);

      expect(result).toEqual([]);
    });
  });

  describe("calculateCurrentAmount - unknown goal type via enrichGoalWithProgress", () => {
    it("should return 0 for unknown goal type", async () => {
      const invalidGoal = {
        id: 999,
        profile_id: 1,
        name: "Invalid Goal",
        type: "invalid_type" as GoalType,
        category: "test",
        target: 1000,
        period: "m",
      } as Goal;

      mockGetUserProfileId.mockResolvedValue(profileId);

      mockGetProfileCategoryTransactions.mockResolvedValue([]);
      mockGetDateCategoryTransactions.mockResolvedValue([]);

      const result = await enrichGoalWithProgress(
        mockPool,
        invalidGoal,
        profileId,
      );
      expect(result.current_amount).toBe(0);
    });

    it("should handle profileId null gracefully", async () => {
      const validGoal = createMockGoal();
      mockGetUserProfileId.mockResolvedValue(null);
      const result = await enrichGoalWithProgress(mockPool, validGoal, null);

      expect(result.current_amount).toBe(0);
    });
  });

  it("should throw error when enrichGoalWithProgress returns null", async () => {
    const mockNewGoal = createMockGoal();
    mockGetUserProfileId.mockResolvedValue(profileId);
    mockGetGoalCountByProfileId.mockResolvedValue(2);
    mockCreateGoal.mockResolvedValue(mockNewGoal);
    const createInput = createMockCreateGoalInput();
    // Spy on enrichGoalWithProgress and make it return null
    const enrichSpy = vi
      .spyOn(goalsLogic, "enrichGoalWithProgress")
      .mockResolvedValue(null as unknown as GoalWithProgress);

    await expect(createUserGoal(mockPool, userId, createInput)).rejects.toThrow(
      "Failed to enrich goal with progress",
    );

    enrichSpy.mockRestore();
  });

  it("should throw error when createGoal returns undefined", async () => {
    mockGetUserProfileId.mockResolvedValue(profileId);
    mockGetGoalCountByProfileId.mockResolvedValue(2);
    mockCreateGoal.mockResolvedValue(undefined); // Simulate undefined result
    const createInput = createMockCreateGoalInput();

    await expect(createUserGoal(mockPool, userId, createInput)).rejects.toThrow(
      "Failed to create goal",
    );
  });
});
