// transaction routes for creating and updating transactions
import { Router } from "express";
import type { Request, Response } from "express";
import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { authenticateJWT } from "../handleJWT.js";
import type { Transaction } from "@/types.js";
import { checkUserId } from "../CheckUser.ts";
import { convertToDateTime } from "../DataConversion.ts";
import { pool as connection, pool } from "../db.ts";

export const transactionsRouter = Router();

// Get all transactions for a specific financial account
transactionsRouter.get("/", async (req: Request, res: Response) => {
  let userId;
  let connection: PoolConnection | undefined;

  try {
    connection = await pool.getConnection();
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

    if (!(await checkUserId(connection, userId, financialAccount_id))) {
      console.error(
        "User is not authorized to create a transaction on this account",
      );
      return res.status(401).json({
        error: "User not authorized to create transaction on this account",
      });
    }

    const [rows] = await connection.query<Transaction[]>(
      `SELECT * FROM transaction WHERE financialAccount_id = ?`,
      [financialAccount_id],
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Failed to fetch transactions", err);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

//creating a new transaction

transactionsRouter.post("/", async (req: Request, res: Response) => {
  let userId;
  let connection: PoolConnection | undefined;
  try {
    connection = await pool.getConnection();
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

    if (!(await checkUserId(connection, userId, financialAccount_id))) {
      console.error(
        "User is not authorized to create a transaction on this account",
      );
      return res.status(401).json({
        error: "User not authorized to create transaction on this account",
      });
    }

    const [result] = await connection.query<ResultSetHeader>(
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
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Update an existing transaction
transactionsRouter.put("/", async (req: Request, res: Response) => {
  let userId;
  let connection: PoolConnection | undefined;

  try {
    connection = await pool.getConnection();
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

    if (!(await checkUserId(connection, userId, financialAccount_id))) {
      console.error(
        "User is not authorized to create a transaction on this account",
      );
      return res.status(401).json({
        error: "User not authorized to create transaction on this account",
      });
    }

    await connection.query(
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
  } finally {
    if (connection) {
      connection.release();
    }
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

    if (!(await checkUserId(connection, userId, financialAccount_id))) {
      console.error("User is not authorized to delete this transaction");
      return res
        .status(401)
        .json({ error: "User not authorized to delete this transaction" });
    }

    await connection.query(`DELETE FROM transaction WHERE id=?`, [id]);

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
    let userId;
    let connection: PoolConnection | undefined;
    try {
      connection = await pool.getConnection();
      const { financialAccount_id, transactions } = req.body;

      if (!financialAccount_id || !Array.isArray(transactions)) {
        return res.status(400).json({ error: "Invalid request payload" });
      }

      // Authenticate user
      try {
        userId = authenticateJWT(req);
      } catch (error) {
        console.error(error);
        return res
          .status(401)
          .json({ error: "User not authorized to import transactions" });
      }

      // Check account ownership
      if (!(await checkUserId(connection, userId, financialAccount_id))) {
        console.error("User is not authorized to import into this account");
        return res.status(401).json({
          error: "User not authorized to import into this account",
        });
      }

      // CSV row shape
      interface CsvRow {
        amount: number | null;
        description: string | null;
        sender?: string | null;
        recipient?: string | null;
        date: string | null;
        category?: string | null;
        errors: string[];
      }

      // Returned transaction shape
      interface CreatedTransaction {
        id: number;
        financialAccount_id: number;
        amount: number;
        category: string;
        date: Date;
        sender: string;
        recipient: string;
        description: string;
      }

      // Filter valid rows
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

      try {
        await connection.beginTransaction();

        const created: CreatedTransaction[] = [];

        for (const row of validRows) {
          const sqlDate = row.date ? convertToDateTime(row.date) : null;

          const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO transaction 
              (financialAccount_id, amount, description, sender, recipient, \`date\`, category)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              financialAccount_id,
              row.amount,
              row.description ?? null,
              row.sender ?? null,
              row.recipient ?? null,
              sqlDate,
              row.category ?? "Uncategorized",
            ],
          );

          created.push({
            id: result.insertId,
            financialAccount_id,
            amount: row.amount ?? 0,
            category: row.category ?? "Uncategorized",
            date: new Date(sqlDate ?? ""),
            sender: row.sender ?? "",
            recipient: row.recipient ?? "",
            description: row.description ?? "",
          });
        }

        await connection.commit();

        res.json({
          message: "CSV transactions imported successfully",
          inserted: created.length,
          skipped: transactions.length - created.length,
          transactions: created,
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
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },
);

//Checks the user is the owner of the account
// async function checkUserId(
//   userId: number,
//   accountId: number,
// ): Promise<boolean> {
//   let result = false;
//   try {
//     //Checks if the profile has an account with that id
//     const [rows] = await db.query(
//       `SELECT * FROM profile_financialAccount
//       WHERE profile_id =? AND financialAccount_id =?`,
//       [userId, accountId],
//     );

//     console.log(rows.length);
//     result = rows.length > 0;
//   } catch (error) {
//     console.error(error);
//   }

//   return result;
// }

// function convertToDateTime(date: string) {
//   return date.slice(0, 19).replace("T", " ");
// }
