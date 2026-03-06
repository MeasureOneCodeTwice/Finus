// account creation route to db service

//TODO import db connection
import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { getConnectionPool } from "@/sqlUtil";
import type { financialAccount } from "@/types.js";
import jwt from "jsonwebtoken";

//import { authenticateJWT } from "../handleJWT.js";

//import { error } from "node:console";
const JWT_SECRET = process.env.JWT_SECRET;
export const accountsRouter = Router();

const db = getConnectionPool();

accountsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, balance, value, subtype } = req.body;
    const last_updated = new Date();

    let userId;

    try {
      userId = authenticateJWT(req);
    } catch (error) {
      console.log(error);
      return res
        .status(401)
        .json({ error: "Not authorized to create an account" });
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO financialAccount (name, type, balance, value, last_updated, subtype)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, balance, value, last_updated, subtype ?? null],
    );

    await db.query(
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
  }
});

accountsRouter.get("/", async (req: Request, res: Response) => {
  let userId;

  try {
    userId = authenticateJWT(req);
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: err });
  }

  if (userId) {
    try {
      const [rows] = await db.query<financialAccount[]>(
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
    }
  }
});

accountsRouter.put("/", async (req: Request, res: Response) => {
  let userId;

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

  //Check if the user is the owner of the account that's bineg updated
  if (!(await checkUserId(userId, account.id))) {
    console.error("User is not own of the account");
    return res
      .status(401)
      .json({ error: "User is not authorized to update accounts" });
  }

  try {
    const { id, name, type, balance, value, subtype } = req.body;

    const last_updated = new Date();

    await db.query<ResultSetHeader>(
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
  }
});

accountsRouter.delete("/", async (req: Request, res: Response) => {
  let userId;

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

  //Checks if user is owner of the acount
  if (!(await checkUserId(userId, id))) {
    console.error("User cannot delete account they didn't create");
    return res
      .status(401)
      .json({ error: "User not authorized to delete this account" });
  }

  try {
    await db.query(
      `DELETE FROM financialAccount
      WHERE id=?`,
      [id],
    );

    return res.status(200).json({ message: "Account successfully deleted" });
  } catch (err) {
    console.error("Failed to delete user's account", err);
    return res.status(500).json({ error: "Failed to delete user's account" });
  }
});

export const authenticateJWT = (req: Request) => {
  const authHeader = req.headers.authorization;
  //console.log(req.headers);
  if (!authHeader) {
    throw new Error("Authorization header missing");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new Error("Invalid authorization header format");
  }
  const token = parts[1];

  //Add as any if it doesn't work
  const decoded = jwt.verify(token, JWT_SECRET);
  const userId = decoded.sub;
  //console.log("user id: " + userId);
  if (!userId) {
    throw new Error("User ID not found in token");
  }

  return userId;
};

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
