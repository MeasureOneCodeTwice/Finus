import express from "express";
import { getConnectionPool, getDatabaseStatus } from "@/sqlUtil";
import { authenticateJWT } from "./utils/auth.ts";
import { generateDateRange } from "./utils/dates.ts";
import { validatePeriod } from "./validation.ts";
import { getExpensesChartData } from "./logic/expenses.ts";
import {
  getAccountIDsForUser,
  getTransactionsData,
} from "./logic/transactions.ts";
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
import { getUserProfileId } from "./queries/goals.ts";
import type { GoalType, UpdateGoalInput } from "./types/Goals.ts";
import { getGoalCountByProfileId } from "./queries/goals.ts";
import { accountsRouter } from "./routes/account.js";
import { profilesRouter } from "./routes/profile.js";
import { transactionsRouter } from "./routes/transaction.js";
import { debtRouter } from "./routes/debt.ts";
import { savingRouter } from "./routes/saving.ts";
import type { Transaction } from "./types/Transaction.ts";
import {
  createTransaction,
  deleteTransactionQuery,
  updateTransactionQuery,
} from "./queries/transactions.ts";

const pool = getConnectionPool();
const app = express();
app.use(buildCorsConfig());

app.use(express.json());

app.use((req, res, next) => {
  console.log("USER Incoming request: " + req.method + " " + req.url);
  next();
});

app.use("/accounts", accountsRouter);
app.use("/transactions", transactionsRouter);
app.use("/profiles", profilesRouter);
app.use("/debts", debtRouter);
app.use("/savings", savingRouter);

const server = app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
onExit(async () => {
  await new Promise((res) => server.close(res));
  await pool.end();
  process.exit(0);
});

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

      // console.log("Fetched transactions for user:", transactions);
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
  "/table/transactions/accounts",
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = authenticateJWT(req);
      const accountsMap = await getAccountIDsForUser(pool, userId);

      //convert Map to array of objects
      const accountsArray: { id: number; name: string }[] = [];
      if (accountsMap instanceof Map) {
        accountsMap.forEach((name, id) => {
          accountsArray.push({ id: Number(id), name });
        });
      }

      res.json(accountsArray);
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

//create a new transaction through the table
app.post(
  "/table/transactions",
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = authenticateJWT(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      //extract financial account id as query param
      const financialAccountId = req.query.fid as string;
      if (!financialAccountId) {
        return res.status(400).json({ error: "Missing financial account ID" });
      }

      //validate request body
      if (!req.body) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      let description = null;
      let category = null;
      let amount = null;
      let date = null;
      let sender = null;
      let recipient = null;

      if (req.body.description) description = req.body.description;
      if (req.body.category) category = req.body.category;
      if (req.body.amount) amount = req.body.amount;
      if (req.body.date) date = req.body.date;
      if (req.body.sender) sender = req.body.sender;
      if (req.body.recipient) recipient = req.body.recipient;

      if (
        !description ||
        !category ||
        !amount ||
        !date ||
        !sender ||
        !recipient
      ) {
        return res.status(400).json({
          error: "Missing required fields for creating a transaction",
        });
      }

      const transactionData: Transaction = {
        id: 0, //this is ignored in creation because it is auto generated
        financialAccount_id: financialAccountId as unknown as number,
        amount: amount,
        category: category,
        description: description,
        sender: sender,
        recipient: recipient,
        date: date,
        constructor: {
          name: "RowDataPacket",
        },
      };

      // console.log("Creating transaction with data:", transactionData);

      const transaction = await createTransaction(
        pool,
        financialAccountId as unknown as number,
        transactionData,
      );

      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof Error && error.message.includes("Authorization")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create transaction" });
      }
    }
  },
);

//delete a transaction through the table
app.delete(
  "/table/transactions",
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = authenticateJWT(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      //extract transaction id as query param
      const transactionId = req.query.tid as unknown as number;
      if (!transactionId) {
        return res.status(400).json({ error: "Missing transaction ID" });
      }

      //get user profile id
      const userProfileId = await getUserProfileId(pool, userId);
      if (!userProfileId) {
        return res.status(404).json({ error: "User profile not found" });
      }

      //delete the transaciton
      const deleted = await deleteTransactionQuery(
        pool,
        transactionId,
        userProfileId,
      );
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      return res.status(200).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      if (error instanceof Error && error.message.includes("Authorization")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to delete transaction" });
      }
    }
  },
);

//update a transaction through the table
app.patch(
  "/table/transactions",
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = authenticateJWT(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      //extract transaction id as query param
      const transactionId = req.query.tid as unknown as number;
      if (!transactionId) {
        return res.status(400).json({ error: "Missing transaction ID" });
      }

      //validate request body
      if (!req.body) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      //need profile id to verify ownership of the transaction via account
      const userProfileId = await getUserProfileId(pool, userId);
      if (!userProfileId) {
        return res.status(404).json({ error: "User profile not found" });
      }

      const updates: Partial<Transaction> = {};
      if (req.body.description !== undefined)
        updates.description = req.body.description;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.amount !== undefined) updates.amount = req.body.amount;
      if (req.body.date !== undefined) updates.date = req.body.date;
      if (req.body.sender !== undefined) updates.sender = req.body.sender;
      if (req.body.recipient !== undefined) updates.recipient = req.body.recipient;
      if (req.body.financialAccount_id !== undefined) updates.financialAccount_id = req.body.financialAccount_id;

      // console.log("Updating transaction with the following updates:", updates);

      const transaction = await updateTransactionQuery(
        pool,
        transactionId,
        userProfileId,
        updates,
      );
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      if (error instanceof Error && error.message.includes("Authorization")) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update transaction" });
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

//export { generateDateRange }; //for testing purposes only

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
    // const userId = authenticateJWT(req);
    // const name = req.body.name;
    // const type = req.body.type;
    // const category = req.body.category;
    // const target = req.body.target;
    // const period = req.body.period;

    const userId = authenticateJWT(req);
    let name = null;
    let type = null;
    let category = null;
    let target = null;
    let period = null;

    if (req.body.name) name = req.body.name;
    if (req.body.type) type = req.body.type;
    if (req.body.category) category = req.body.category;
    if (req.body.target) target = req.body.target;
    if (req.body.period) period = req.body.period;

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
    // const goalId = parseInt(req.query.gid);
    let goalId = null;

    if (req.query.gid) goalId = req.query.gid as unknown as number; //parseInt()

    if (!goalId) {
      return res.status(404).json({ error: "Missing goal ID" });
    }

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
    const userId = authenticateJWT(req);
    // const goalId = parseInt(req.query.gid);

    let goalId = null;

    if (req.query.gid) goalId = req.query.gid as unknown as number; //parseInt()

    if (!goalId) {
      return res.status(404).json({ error: "Missing goal ID" });
    }

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

app.get("/health", async (_, res) => {
  const status = await getDatabaseStatus();
  res.send(status);
});

export { generateDateRange }; //for testing purposes only
