// transaction routes for creating and updating transactions 
import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { db } from "../db/connection";

export const transactionsRouter = Router();

//creating a new transaction

transactionsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { financialAccount_id, amount, description, sender, recipient, date } = req.body;

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO transaction (financialAccount_id, amount, description, sender, recipient, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [financialAccount_id, amount, description ?? null, sender ?? null, recipient ?? null, date]
    );

    res.json({
      message: "Transaction successfully created",
      id: result.insertId
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
    const {amount,description, sender, recipient, date} = req.body;

    await db.query(
      `UPDATE transaction
       SET amount=?, description=?, sender=?, recipient=?, date=?
       WHERE id=?`,
      [amount, description ?? null, sender ?? null, recipient ?? null, date, id]
    );

    res.json({ message: "Transaction successfully updated" });
  } catch (err) {
    console.error("Transaction update failed", err);  }
});

// CSV Transaction 
transactionsRouter.post("/csvTransaction", async (req: Request, res: Response) => {
  try {
    const { financialAccount_id, transactions } = req.body;

    if (!financialAccount_id || !Array.isArray(transactions)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const validRows = transactions.filter((t: any) => t.errors.length === 0);

    if (validRows.length === 0) {
      return res.status(400).json({ error: "No valid transactions to import" });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      for (const row of validRows) {
        await connection.query(
          `INSERT INTO transaction (financialAccount_id, amount, description, sender, recipient, date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            financialAccount_id,
            row.amount,
            row.description ?? null,
            row.sender ?? null,
            row.recipient ?? null,
            row.date,
          ]
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
});
