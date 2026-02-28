// account creation route to db service

//TODO import db connection
import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { db } from "../db/connection";

export const accountsRouter = Router();

accountsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, balance, value, subtype } = req.body;

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO financialAccount (name, type, balance, value, subtype)
       VALUES (?, ?, ?, ?, ?)`,
      [name, type, balance, value, subtype ?? null]
    );

    res.json({
      message: "Account successfully created",
      id: result.insertId,
      
    });
    res.append("Access-Control-Allow-Origin", "http://localhost:8080/")
  } catch (err) {
    console.error("Account creation failed", err);
    res.status(500).json({ error: "Account creation failed" });
  }
});
