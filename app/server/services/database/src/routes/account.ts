// account creation route to db service

//TODO import db connection
import { Router, Request, Response } from "express";
import { db } from "../db/connection";

export const accountsRouter = Router();

accountsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, balance, value, subtype } = req.body;

    const [result] = await db.query(
      `INSERT INTO financialAccount (name, type, balance, value, subtype)
       VALUES (?, ?, ?, ?, ?)`,
      [name, type, balance, value, subtype ?? null]
    );

    res.json({
      message: "Account successfully created",
      id: result.insertId
    });
  } catch (err) {
    console.error("Account creation failed", err);
  }
});
