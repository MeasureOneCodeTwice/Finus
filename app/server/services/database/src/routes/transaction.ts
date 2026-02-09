// transaction routes for creating and updating transactions 
import { Router, Request, Response } from "express";
import { db } from "../db/connection";

export const transactionsRouter = Router();

//creating a new transaction

transactionsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { financialAccount_id, amount, description, sender, recipient, date } = req.body;

    const [result] = await db.query(
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
