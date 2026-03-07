// transaction routes for creating and updating transactions
import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { getConnectionPool } from "@/sqlUtil";
import { authenticateJWT } from "../handleJWT.js";
import type { Transaction } from "@/types.js";

export const transactionsRouter = Router();

const db = getConnectionPool();
// Get all transactions for a specific financial account
transactionsRouter.get("/", async (req: Request, res: Response) => {
  let userId;

  try {
    const financialAccount_id = Number(req.query.financialAccount_id);

    if (!financialAccount_id) {
      return res.status(400).json({ error: "Missing financialAccount_id" });
    }

    try {
      userId = authenticateJWT(req);
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ error: "User not authorized to create a transaction" });
    }

    if (!(await checkUserId(userId, financialAccount_id))) {
      console.error(
        "User is not authorized to create a transaction on this account",
      );
      return res.status(401).json({
        error: "User not authorized to create transaction on this account",
      });
    }

    const [rows] = await db.query<Transaction>(
      `SELECT * FROM transaction WHERE financialAccount_id = ?`,
      [financialAccount_id],
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Failed to fetch transactions", err);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

//creating a new transaction

transactionsRouter.post("/", async (req: Request, res: Response) => {
  let userId;
  try {
    const {
      financialAccount_id,
      amount,
      description,
      sender,
      recipient,
      date,
      category,
    } = req.body;

    const sqlDate = convertToDateTime(date);

    try {
      userId = authenticateJWT(req);
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ error: "User not authorized to create a transaction" });
    }

    if (!(await checkUserId(userId, financialAccount_id))) {
      console.error(
        "User is not authorized to create a transaction on this account",
      );
      return res.status(401).json({
        error: "User not authorized to create transaction on this account",
      });
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO transaction (financialAccount_id, amount, description, sender, recipient, date, category )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        financialAccount_id,
        amount,
        description ?? null,
        sender ?? null,
        recipient ?? null,
        sqlDate,
        category ?? null,
      ],
    );

    res.status(200).json({
      message: "Transaction successfully created",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Transaction creation failed", err);
    res.status(500).json({ error: "Transaction creation failed" });
  }
});

// Update an existing transaction
transactionsRouter.put("/", async (req: Request, res: Response) => {
  let userId;

  try {
    const {
      id,
      financialAccount_id,
      amount,
      description,
      sender,
      recipient,
      date,
    } = req.body;

    const sqlDate = convertToDateTime(date);

    try {
      userId = authenticateJWT(req);
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ error: "User not authorized to create a transaction" });
    }

    if (!(await checkUserId(userId, financialAccount_id))) {
      console.error(
        "User is not authorized to create a transaction on this account",
      );
      return res.status(401).json({
        error: "User not authorized to create transaction on this account",
      });
    }

    await db.query(
      `UPDATE transaction
       SET amount=?, description=?, sender=?, recipient=?, date=?
       WHERE id=?`,
      [
        amount,
        description ?? null,
        sender ?? null,
        recipient ?? null,
        sqlDate,
        id,
      ],
    );

    res.json({ message: "Transaction successfully updated" });
  } catch (err) {
    console.error("Transaction update failed", err);
  }
});

// DELETE /transactions/:id
transactionsRouter.delete("/", async (req: Request, res: Response) => {
  try {
    const { id, financialAccount_id } = req.body;
    let userId;

    if (!(id && financialAccount_id)) {
      console.error("Failed to delete transaction, parameter not recieved");
      return res.status(400).json({ error: "Bad request" });
    }

    try {
      userId = authenticateJWT(req);
    } catch (error) {
      console.error(error);
      return res
        .status(401)
        .json({ error: "User not authorized to delete transaction" });
    }

    if (!(await checkUserId(userId, financialAccount_id))) {
      console.error("User is not authorized to delete this transaction");
      return res
        .status(401)
        .json({ error: "User not authorized to delete this transaction" });
    }

    await db.query(`DELETE FROM transaction WHERE id=?`, [id]);

    res.status(200).json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("Transaction deletion failed", err);
    res.status(500).json({ error: "Transaction deletion failed" });
  }
});

// CSV Transaction
transactionsRouter.post(
  "/csvTransaction",
  async (req: Request, res: Response) => {
    try {
      const { financialAccount_id, transactions } = req.body;

      if (!financialAccount_id || !Array.isArray(transactions)) {
        return res.status(400).json({ error: "Invalid request payload" });
      }

      // expected shape of a validated CSV row
      interface CsvRow {
        amount: number | null;
        description: string | null;
        sender?: string | null;
        recipient?: string | null;
        date: string | null;
        category?: string | null;
        errors: string[];
      }

      const validRows = transactions.filter(
        (t: unknown): t is CsvRow =>
          typeof t === "object" &&
          t !== null &&
          Array.isArray((t as { errors?: unknown }).errors) &&
          (t as { errors: unknown[] }).errors.length === 0,
      );

      if (validRows.length === 0) {
        return res
          .status(400)
          .json({ error: "No valid transactions to import" });
      }

      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        for (const row of validRows) {
          await connection.query(
            `INSERT INTO transaction (financialAccount_id, amount, description, sender, recipient, date, category)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              financialAccount_id,
              row.amount,
              row.description ?? null,
              row.sender ?? null,
              row.recipient ?? null,
              row.date,
              row.category ?? "Uncategorized",
            ],
          );
        }

        await connection.commit();

        res.json({
          message: "CSV transactions imported successfully",
          inserted: validRows.length,
          skipped: transactions.length - validRows.length,
        });
      } catch (err) {
        await connection.rollback();
        console.error("CSV transaction import failed", err);
        res.status(500).json({ error: "CSV transaction import failed" });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error("CSV transaction import failed", err);
      res.status(500).json({ error: "CSV transaction import failed" });
    }
  },
);

//Checks the user is the owner of the account
async function checkUserId(
  userId: number,
  accountId: number,
): Promise<boolean> {
  let result = false;
  try {
    //Checks if the profile has an account with that id
    const [rows] = await db.query(
      `SELECT 1 FROM profile_financialAccount 
      WHERE profile_id =? AND financialAccount_id =?`,
      [userId, accountId],
    );

    console.log(rows.length);
    if (rows.length > 0) {
      result = true;
    }
  } catch (error) {
    console.error(error);
  }

  return result;
}

function convertToDateTime(date: string) {
  return date.slice(0, 19).replace("T", " ");
}
