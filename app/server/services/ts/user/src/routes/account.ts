// account creation route to db service

//TODO import db connection
import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { getConnectionPool } from "@/sqlUtil";
import type { financialAccount } from "@/types.js";
//import { error } from "node:console";

export const accountsRouter = Router();

const db = getConnectionPool();

accountsRouter.post("/", async (req: Request, res: Response) => {
  try {
    //console.log(req.body);
    const { name, type, balance, value, subtype } = req.body;

    const last_updated = new Date().toISOString();

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO financialAccount (name, type, balance, value, last_updated, subtype)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, balance, value, last_updated, subtype ?? null],
    );

    res.json({
      message: "Account successfully created",
      id: result.insertId,
      lastUpdated: last_updated,
    });
  } catch (err) {
    console.error("Account creation failed", err);
    res.status(500).json({ error: "Account creation failed" });
  }
});

accountsRouter.get("/", async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    const [result] = await db.query(
      `SELECT * FROM financialAccount WHERE id = ?`,
      [id],
    );

    const accounts: financialAccount[] = new Array(result.length);

    for (let i = 0; i < result.length; i++) {
      accounts[i] = result[i];
    }

    res.json(accounts);
  } catch (err) {
    console.error("Failed to retrieve user's account", err);
    res.status(500).json({ error: "Failed to retrieve account(s)" });
  }
});

accountsRouter.put("/", async (req: Request, res: Response) => {
  try {
    const { id, name, type, balance, value, subtype } = req.body;

    const last_updated = new Date().toISOString();

    await db.query<ResultSetHeader>(
      `UPDATE financialAccount 
      SET name = ?, type = ?, balence = ?, value = ?, last_updated = ?, subtype = ?
      WHERE id= ?`,
      [name, type, balance, value, last_updated, subtype ?? null, id],
    );

    res.json({
      message: "Account successfully updated",
      lastUpdated: last_updated,
    });
  } catch (err) {
    console.error("Failed to update user's account", err);
    res.status(500).json({ error: "Failed to update user's account" });
  }
});

accountsRouter.delete("/", async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    await db.query(
      `DELETE FROM financialAccount
      WHERE id=?`,
      [id],
    );

    res.json({ message: "Account successfully deleted" });
  } catch (err) {
    console.error("Failed to delete user's account", err);
    res.status(500).json({ error: "Failed to delete user's account" });
  }
});
