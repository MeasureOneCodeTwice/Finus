import { Pool } from "mysql2/promise";
import * as goalsQueries from "../queries/goals.ts";
import * as transactionsQueries from "../queries/transactions.ts";
import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalWithProgress,
} from "../types/Goals.ts";

const MAX_GOALS_PER_PROFILE = 5;

//get current spending/achievement for a goal based on transactions
async function calculateCurrentAmount(
  pool: Pool,
  goal: Goal,
  profileId: number | null,
): Promise<number> {
  if (!profileId) {
    // console.log("No profileId provided");
    // throw new Error("No profileId provided");
    return 0;
  }

  if (goal.type === "reduce_spending") {
    const period = goal.period;
    const now = new Date();
    let startDate: Date;

    if (period === "w") {
      // Start of week (Sunday)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      // console.log(`Weekly period: ${startDate.toISOString()} to ${now.toISOString()}`);
    } else {
      // Start of month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      // console.log(`Monthly period: ${startDate.toISOString()} to ${now.toISOString()}`);
    }

    //get expenses (negative amounts) for this category in the period
    const expenses = await transactionsQueries.getDateCategoryTransactionsQuery(
      pool,
      profileId,
      goal.category!,
      startDate,
      now,
    );

    //sum the amounts (they are negative, so sum will be negative)
    const totalSpending = expenses.reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );

    //return absolute value for display
    // console.log(`Total spending for ${goal.category}: ${totalSpending}`);
    return Math.abs(totalSpending);
  } else if (goal.type === "save") {
    // For savings goals, get all transactions for this category
    const transactions =
      await transactionsQueries.getProfileCategoryTransactionsQuery(
        pool,
        profileId,
        goal.category!,
      );

    //sum all amounts (positive = savings, negative = expenses)
    const total = transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );

    return total > 0 ? total : 0;
  }

  return 0;
}

export async function getGoalsByProfileId(
  pool: Pool,
  profileId: number,
): Promise<Goal[]> {
  const goals = await goalsQueries.getGoalsByProfileId(pool, profileId);
  return goals;
}

//enrich a goal with calculated progress
export async function enrichGoalWithProgress(
  pool: Pool,
  goal: Goal,
  profileId: number,
): Promise<GoalWithProgress> {
  const current_amount = await calculateCurrentAmount(pool, goal, profileId);
  const progress_percentage = Math.min(
    (current_amount / goal.target) * 100,
    100,
  );

  console.log(
    "enriching goal with progress, cur amount:",
    current_amount,
    "progress percentage:",
    progress_percentage,
    " because target is:",
    goal.target,
  );

  return {
    ...goal,
    current_amount,
    progress_percentage,
  };
}

export async function getUserGoals(
  pool: Pool,
  userId: number,
): Promise<GoalWithProgress[]> {
  const profileId = await goalsQueries.getUserProfileId(pool, userId);
  if (!profileId) return [];

  const goals = await goalsQueries.getGoalsByProfileId(pool, profileId);

  const goalsWithProgress = await Promise.all(
    goals.map((goal) => enrichGoalWithProgress(pool, goal, profileId)),
  );

  return goalsWithProgress;
}

//gets a single goal by id - this is used for patching goals
export async function getUserGoalById(
  pool: Pool,
  goalId: number,
  userId: number,
): Promise<GoalWithProgress | null> {
  const profileId = await goalsQueries.getUserProfileId(pool, userId);
  if (!profileId) return null;

  const goal = await goalsQueries.getGoalById(pool, goalId, profileId);
  if (!goal) return null;

  return enrichGoalWithProgress(pool, goal, profileId);
}

export async function createUserGoal(
  pool: Pool,
  userId: number,
  goalData: CreateGoalInput,
): Promise<GoalWithProgress> {
  const profileId = await goalsQueries.getUserProfileId(pool, userId);
  if (!profileId) {
    throw new Error("User profile not found");
  }

  //validate goal count
  const goalCount = await goalsQueries.getGoalCountByProfileId(pool, profileId);
  if (goalCount >= MAX_GOALS_PER_PROFILE) {
    throw new Error(
      `Maximum ${MAX_GOALS_PER_PROFILE} goals allowed per profile`,
    );
  }

  //validate input based on goal type
  validateGoalInput(goalData);

  const newGoal = await goalsQueries.createGoal(pool, profileId, goalData);
  if (!newGoal) {
    throw new Error("Failed to create goal");
  }

  const enrichedGoal = await enrichGoalWithProgress(pool, newGoal, profileId);
  if (!enrichedGoal) {
    throw new Error("Failed to enrich goal with progress");
  }

  return enrichedGoal;
}

export async function updateUserGoal(
  pool: Pool,
  goalId: number,
  userId: number,
  updates: UpdateGoalInput,
): Promise<GoalWithProgress> {
  const profileId = await goalsQueries.getUserProfileId(pool, userId);
  if (!profileId) {
    throw new Error("User profile not found");
  }

  const existingGoal = await goalsQueries.getGoalById(pool, goalId, profileId);
  if (!existingGoal) {
    throw new Error("Goal not found");
  }

  //validate updates - maybe expand on this if needed
  validateGoalUpdates(updates);

  const updated = await goalsQueries.updateGoal(
    pool,
    goalId,
    profileId,
    updates,
  );
  if (!updated) {
    throw new Error("Failed to update goal");
  }

  const updatedWithProgress = await enrichGoalWithProgress(
    pool,
    updated,
    profileId,
  );
  if (!updatedWithProgress) {
    throw new Error("Failed to enrich goal with progress");
  }

  return updatedWithProgress;
}

export async function deleteUserGoal(
  pool: Pool,
  goalId: number,
  userId: number,
): Promise<boolean> {
  const profileId = await goalsQueries.getUserProfileId(pool, userId);
  if (!profileId) {
    throw new Error("User profile not found");
  }

  const deleted = await goalsQueries.deleteGoal(pool, goalId, profileId);
  if (!deleted) {
    throw new Error("Goal not found or already deleted");
  }
  return true;
}

//validation functions (same as before, but updated for new fields)
function validateGoalInput(input: CreateGoalInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Goal name is required");
  }

  if (input.target <= 0) {
    throw new Error("Target amount must be greater than 0");
  }

  if (input.type === "reduce_spending" && !input.category) {
    throw new Error("Spending limit goals require a category");
  }
}

function validateGoalUpdates(updates: UpdateGoalInput): void {
  if (updates.target !== undefined && updates.target <= 0) {
    throw new Error("Target amount must be greater than 0");
  }
}
