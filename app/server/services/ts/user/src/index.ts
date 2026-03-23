import express from "express";
import { pool } from "./db.ts";
import { authenticateJWT } from "./utils/auth.ts";
import { generateDateRange } from "./utils/dates.ts";
import { validatePeriod } from "./validation.ts";
import { getExpensesChartData } from "./logic/expenses.ts";
import { getTransactionsData } from "./logic/transactions.ts";
import { getSnapshotData } from "./logic/snapshot.ts";
import { onExit } from "@/hooks";
import { buildCorsConfig } from "@/expressUtils";
import { PORT } from "@/port";
import {
  deleteUserGoal,
  createUserGoal,
  updateUserGoal,
  getUserGoals,
  getUserGoalById,
} from "./logic/goals.ts";
import type { GoalType, UpdateGoalInput } from "./types/Goals.ts";
import { getGoalCountByProfileId } from "./queries/goals.ts";
import { accountsRouter } from "./routes/account.js";
import { profilesRouter } from "./routes/profile.js";
import { transactionsRouter } from "./routes/transaction.js";

const app = express();
app.use(buildCorsConfig());
onExit(async () => await server.close());

app.use(express.json());

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log("USER Incoming request: " + req.method + " " + req.url);
    console.log(req.body);
    next();
  },
);

app.use("/accounts", accountsRouter);
app.use("/transactions", transactionsRouter);
app.use("/profiles", profilesRouter);

const server = app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
process.on("SIGTERM", () => server.close());

app.get(
  "/charts/expenses",
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = authenticateJWT(req);
      const period = req.query.period as string;

      if (!validatePeriod(period)) {
        return res
          .status(400)
          .json({ error: "Invalid period. Must be 'w', 'm', or 'y'." });
      }

      const chartData = await getExpensesChartData(pool, userId, period);
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching expenses chart data:", error);
      if (error instanceof Error && error.message.includes("Authorization")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to fetch expenses chart data" });
      }
    }
  },
);

app.get(
  "/table/transactions",
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = authenticateJWT(req);
      const transactions = await getTransactionsData(pool, userId);

      if (!transactions || transactions.length === 0) {
        return res.json([]); // Return empty array for no transactions
      }

      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (error instanceof Error && error.message.includes("Authorization")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to fetch transactions" });
      }
    }
  },
);

app.get(
  "/table/snapshot",
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = authenticateJWT(req);

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const snapshotData = await getSnapshotData(pool, userId);
      res.json(snapshotData);
    } catch (error) {
      console.error("Error fetching snapshot data:", error);
      if (error instanceof Error) {
        if (error.message.includes("Authorization")) {
          res.status(401).json({ error: error.message });
        } else if (error.message.includes("No snapshot data")) {
          res.status(404).json({ error: "No snapshot data found" });
        } else {
          res.status(500).json({ error: "Failed to fetch snapshot data" });
        }
      } else {
        res.status(500).json({ error: "Failed to fetch snapshot data" });
      }
    }
  },
);

export { generateDateRange }; //for testing purposes only

// Goal stuff is below------------------------------------------------------

// GET all goals
app.get("/goals", async (req: express.Request, res: express.Response) => {
  try {
    const userId = authenticateJWT(req);

    const goals = await getUserGoals(pool, userId);

    res.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  }
});

// POST create new goal
app.post("/goals", async (req: express.Request, res: express.Response) => {
  try {
    const userId = authenticateJWT(req);
    const name = req.body.name;
    const type = req.body.type;
    const category = req.body.category;
    const target = req.body.target;
    const period = req.body.period;

    if (!name || !type || !target || !period) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    //check goal limit (max 5)
    const goalCount = await getGoalCountByProfileId(pool, userId);
    if (goalCount >= 5) {
      return res
        .status(400)
        .json({ error: "Maximum 5 goals allowed per profile" });
    }

    const newGoal = await createUserGoal(pool, userId, {
      name,
      type,
      category,
      target,
      period,
    });
    res.status(201).json(newGoal);
  } catch (error) {
    console.error("Error creating goal:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to create goal" });
    }
  }
});

// PATCH update goal
app.patch("/goals", async (req: express.Request, res: express.Response) => {
  try {
    const userId = authenticateJWT(req);
    const goalId = parseInt(req.query.gid);

    //verify goal exists and belongs to user
    const existingGoal = await getUserGoalById(pool, goalId, userId);
    if (!existingGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    //build updates object with only provided fields - for security
    const updates: UpdateGoalInput = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.category !== undefined)
      updates.category = req.body.category.toLowerCase();
    if (req.body.target !== undefined) updates.target = req.body.target;
    if (req.body.period !== undefined) {
      updates.period = req.body.period;
    } //period can be 'na' if goal is savings
    if (req.body.type !== undefined) updates.type = req.body.type;

    //check that period exists if the goal type is reduce_spending, it doesn't matter if type is 'save' because period is ignored
    if (
      updates.type &&
      updates.type === ("reduce_spending" as GoalType) &&
      !updates.period
    ) {
      return res
        .status(400)
        .json({ error: "Period is required for reduce_spending goals" });
    }

    //validate updates
    if (updates.target !== undefined && updates.target <= 0) {
      return res
        .status(400)
        .json({ error: "Target amount must be greater than 0" });
    }

    const updatedGoal = await updateUserGoal(pool, goalId, userId, updates);

    if (!updatedGoal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(updatedGoal);
  } catch (error) {
    console.error("Error updating goal:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update goal" });
    }
  }
});

// DELETE goal
app.delete("/goals", async (req: express.Request, res: express.Response) => {
  try {
    console.log("deleting goal");

    const userId = authenticateJWT(req);
    const goalId = parseInt(req.query.gid);

    const deleted = await deleteUserGoal(pool, goalId, userId);
    if (!deleted) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting goal:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  }
});
