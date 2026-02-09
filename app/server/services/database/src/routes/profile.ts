// profile creation route this lets us create profiles in the db , which can be used to group accounts together and track them.


import { Router, Request, Response } from "express";
import { db } from "../db/connection";

export const profilesRouter = Router();

// Create a profile
profilesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const [result] = await db.query(
      `INSERT INTO profile (name, description)
       VALUES (?, ?)`,
      [name, description ?? null]
    );

    res.json({
      message: "Profile successfully created",
      id: result.insertId
    });
  } catch (err) {
    console.error("Profile creation failed:", err);
  }
});
