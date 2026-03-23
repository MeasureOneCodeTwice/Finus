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
  if (goal.type === "reduce_spending") {
    //get the current period's spending, this can be either a week or a month
    const period = goal.period;
    const now = new Date();

    if (period == "w") {
      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay(),
      );
      const spending =
        await transactionsQueries.getDateCategoryTransactionsQuery(
          pool,
          profileId ? profileId : 0,
          goal.category!,
          startOfWeek,
          now,
        );
      const total_spending = spending.reduce(
        (total, transaction) => total + transaction.amount,
        0,
      );
      console.log("returning weekly total spending: ", total_spending);
      return total_spending;
    } else {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const spending =
        await transactionsQueries.getDateCategoryTransactionsQuery(
          pool,
          profileId ? profileId : 0,
          goal.category!,
          startOfMonth,
          now,
        );
      const total_spending = spending.reduce(
        (total, transaction) => total + transaction.amount,
        0,
      );
      console.log("returning monthly total spending: ", total_spending);
      return total_spending;
    }
  } else if (goal.type === "save") {
    const savings_expenses =
      await transactionsQueries.getProfileCategorySavingsQuery(
        pool,
        profileId ? profileId : 0,
        goal.category!,
      );

    //aggregate the rows as savings - expenses (expese transaction values are negative though so this is a sum of savings and expenses)
    const total_savings = savings_expenses.reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );
    console.log("returning total savings: ", total_savings);
    return total_savings;
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

// Enrich a goal with calculated progress
export async function enrichGoalWithProgress(
  pool: Pool,
  goal: Goal,
  userId: number,
): Promise<GoalWithProgress> {
  const profileId = await goalsQueries.getUserProfileId(pool, userId);
  const current_amount = await calculateCurrentAmount(pool, goal, profileId);
  console.log(
    "In enrich goals function - got a current amount for goal: ",
    current_amount,
  );
  const progress_percentage = Math.min(
    (current_amount / goal.target) * 100,
    100,
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
  if (!newGoal) {
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
