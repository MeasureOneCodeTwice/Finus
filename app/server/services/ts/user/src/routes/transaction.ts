// transaction routes for creating and updating transactions
import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { getConnectionPool } from "@/sqlUtil";

export const transactionsRouter = Router();

const db = getConnectionPool();
// Get all transactions for a specific financial account
transactionsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ error: "Missing account_id" });
    }

    const [rows] = await db.query(
      `SELECT * FROM transaction WHERE financialAccount_id = ?`,
      [account_id],
    );

    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch transactions", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

//creating a new transaction

transactionsRouter.post("/", async (req: Request, res: Response) => {
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

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO transaction (financialAccount_id, amount, description, sender, recipient, date, category )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        financialAccount_id,
        amount,
        description ?? null,
        sender ?? null,
        recipient ?? null,
        date,
        category ?? null,
      ],
    );

    res.json({
      message: "Transaction successfully created",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Transaction creation failed", err);
    res.status(500).json({ error: "Transaction creation failed" });
  }
});

// Update an existing transaction
transactionsRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { amount, description, sender, recipient, date } = req.body;

    await db.query(
      `UPDATE transaction
       SET amount=?, description=?, sender=?, recipient=?, date=?
       WHERE id=?`,
      [
        amount,
        description ?? null,
        sender ?? null,
        recipient ?? null,
        date,
        id,
      ],
    );

    res.json({ message: "Transaction successfully updated" });
  } catch (err) {
    console.error("Transaction update failed", err);
  }
});

// DELETE /transactions/:id
transactionsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    await db.query(`DELETE FROM transaction WHERE id=?`, [id]);

    res.json({ message: "Transaction deleted" });
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
