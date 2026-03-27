// account creation route to db service

//TODO import db connection
import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader, PoolConnection } from "mysql2/promise";
import type { financialAccount } from "@/types.js";
import { authenticateJWT } from "../handleJWT.js";
import { checkUserId } from "../CheckUser.ts";
import { pool } from "../db.ts";

//import { authenticateJWT } from "../handleJWT.js";

//import { error } from "node:console";
export const accountsRouter = Router();

accountsRouter.post("/", async (req: Request, res: Response) => {
  let connection: PoolConnection | undefined;
  try {
    connection = await pool.getConnection();
    const { name, type, balance, value, subtype } = req.body;
    const last_updated = new Date();

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!type || typeof type !== "string") {
      return res.status(400).json({ error: "Type is required" });
    }

    if (balance === undefined || balance === null || isNaN(balance)) {
      return res.status(400).json({ error: "Balance is required" });
    }

    if (value === undefined || value === null || isNaN(value)) {
      return res.status(400).json({ error: "Value is required" });
    }

    let userId;

    try {
      userId = authenticateJWT(req);
    } catch (error) {
      console.log(error);
      return res
        .status(401)
        .json({ error: "Not authorized to create an account" });
    }

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO financialAccount (name, type, balance, value, last_updated, subtype)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, balance, value, last_updated, subtype ?? null],
    );

    await connection.query(
      `INSERT INTO profile_financialAccount (profile_id, financialAccount_id)
      VALUES (?,?)`,
      [userId, result.insertId],
    );

    console.log("Created account " + name);
    return res.status(200).json({
      message: "Account successfully created",
      id: result.insertId,
      lastUpdated: last_updated,
    });
  } catch (err) {
    console.error("Account creation failed", err);
    return res.status(500).json({ error: "Account creation failed" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

accountsRouter.get("/", async (req: Request, res: Response) => {
  let userId;
  let connection: PoolConnection | undefined;
  try {
    userId = authenticateJWT(req);
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: err });
  }

  if (userId) {
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query<financialAccount[]>(
        `SELECT * FROM financialAccount JOIN profile_financialAccount pfa 
        ON financialAccount.id = pfa.financialAccount_id
        WHERE pfa.profile_id = ?`,
        [userId],
      );

      console.log(rows);

      return res.status(200).json(rows);
    } catch (err) {
      console.error("Failed to retrieve user's account", err);
      return res.status(500).json({ error: "Failed to retrieve account(s)" });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
});

accountsRouter.put("/", async (req: Request, res: Response) => {
  let userId;
  let connection: PoolConnection | undefined;

  //Checks if was given by the requests
  if (isAccount(req.body)) {
    console.error("No account was given");
    return res.status(400).json({ error: "No account was given" });
  }

  const account: financialAccount = req.body;

  //Determine if the user is authorized to make this request
  try {
    userId = authenticateJWT(req);
  } catch (error) {
    console.error(error);
    return res
      .status(401)
      .json({ error: "User not authorized to update account" });
  }

  try {
    connection = await pool.getConnection();

    //Check if the user is the owner of the account that's bineg updated
    if (!(await checkUserId(connection, userId, account.id))) {
      console.error("User is not own of the account");
      return res
        .status(401)
        .json({ error: "User is not authorized to update accounts" });
    }

    const { id, name, type, balance, value, subtype } = req.body;

    const last_updated = new Date();

    await connection.query<ResultSetHeader>(
      `UPDATE financialAccount 
      SET name = ?, type = ?, balance = ?, value = ?, last_updated = ?, subtype = ?
      WHERE id= ?`,
      [name, type, balance, value, last_updated, subtype ?? null, id],
    );

    console.log("Updated Account " + name);
    return res.status(200).json({
      message: "Account successfully updated",
      lastUpdated: last_updated,
    });
  } catch (err) {
    console.error("Failed to update user's account", err);
    return res.status(500).json({ error: "Failed to update user's account" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

accountsRouter.delete("/", async (req: Request, res: Response) => {
  let userId;
  let connection: PoolConnection | undefined;
  const { id } = req.body;

  try {
    userId = authenticateJWT(req);
  } catch (error) {
    console.error(error);
    return res
      .status(401)
      .json({ error: "User is not authorized to delete an account" });
  }

  //Checks if we were provided with a account id to delete
  if (!id) {
    console.error("Delete failed because no account id was provided");
    return res
      .status(400)
      .json({ error: "Bad request: No account was givens" });
  }

  try {
    connection = await pool.getConnection();

    //Checks if user is owner of the acount
    if (!(await checkUserId(connection, userId, id))) {
      console.error("User cannot delete account they didn't create");
      return res
        .status(401)
        .json({ error: "User not authorized to delete this account" });
    }

    await connection.query(
      `DELETE FROM financialAccount
      WHERE id=?`,
      [id],
    );

    await connection.query(
      "DELETE FROM transaction WHERE financialAccount_id=?",
      [id],
    );

    return res.status(200).json({ message: "Account successfully deleted" });
  } catch (err) {
    console.error("Failed to delete user's account", err);
    return res.status(500).json({ error: "Failed to delete user's account" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

function isAccount(reqBody: unknown): reqBody is financialAccount {
  //Checks if it exists and is an object
  if (typeof reqBody !== "object" || reqBody === null) {
    //Neither
    return false;
  }

  //Constrained to not use any, so using Record instead
  const check = reqBody as Record<string, unknown>;

  //Checks if the fields match to an financial account
  return (
    typeof check.id === "number" &&
    typeof check.balance === "number" &&
    typeof check.type === "string" &&
    typeof check.name === "string" &&
    typeof check.value === "number" &&
    typeof check.subtype === "string" &&
    check.last_updated instanceof Date
  );
}
