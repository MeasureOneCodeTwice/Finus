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

// import express from "express";
import { accountsRouter } from "./routes/account.js";
import { profilesRouter } from "./routes/profile.js";
import { transactionsRouter } from "./routes/transaction.js";
import { debtRouter } from "./routes/debt.ts";
import { savingRouter } from "./routes/saving.ts";

const app = express();
app.use(buildCorsConfig());
onExit(async () => await server.close());

app.use(express.json());

app.use((req, res, next) => {
  console.log("USER Incoming request: " + req.method + " " + req.url);
  console.log(req.body);
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
process.on("SIGTERM", () => cleanup);

 async function cleanup() {
  try{
    server.close()
    await pool.end()
  } catch(error){
    console.log(error)
  }
}

app.get("/charts/expenses", async (req, res) => {
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
});

app.get("/table/transactions", async (req, res) => {
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
});

app.get("/table/snapshot", async (req, res) => {
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
});

export { generateDateRange }; //for testing purposes only
