// account creation route to db service

//TODO import db connection
import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { getConnectionPool } from "@/sqlUtil"

export const accountsRouter = Router();

const db = getConnectionPool()
accountsRouter.post("/", async (req: Request, res: Response) => {
  try {
    console.log(req.body)
    const { name, type, balance, value, subtype } = req.body;

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO financialAccount (name, type, balance, value, subtype)
       VALUES (?, ?, ?, ?, ?)`,
      [name, type, balance, value, subtype ?? null]
    );

    res.json({
      message: "Account successfully created",
      id: result.insertId,
      lastUpdated: new Date()
      
    });
  
  } catch (err) {
    console.error("Account creation failed", err);
    res.status(500).json({ error: "Account creation failed" });
  }
});

