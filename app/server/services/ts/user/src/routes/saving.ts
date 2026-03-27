import { Router } from "express";
import type { Request, Response } from "express";
import { authenticateJWT } from "../handleJWT.js";
import { UnauthorizedAccessError } from "../types/UnauthorizedAccess.ts";
import {
  createSavingAccount,
  getSavingAccount,
  getSavingAccountTransactionBy,
} from "../logic/saving.ts";
import { BadRequestError } from "../types/BadRequestError.ts";
export const savingRouter = Router();

savingRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = authenticateJWT(req);
    const savings = await getSavingAccount(userId);
    res.status(200).json(savings);
  } catch (err: unknown) {
    if (err instanceof UnauthorizedAccessError) {
      console.error("User is not authorized to access saving", err);
      return res
        .status(401)
        .json({ error: "User is not authorized to access saving" });
    } else {
      console.error("Saving access failed", err);
      res.status(500).json({ error: "Saving access failed" });
    }
  }
});
savingRouter.get(
  "/:financialAccountId/transactions",
  async (req: Request, res: Response) => {
    try {
      // const userId = authenticateJWT(req);
      const financialAccountId = req.params.financialAccountId?.toString();
      console.log("Financial account id: ", financialAccountId);
      const transactions =
        await getSavingAccountTransactionBy(financialAccountId);
      res.status(200).json(transactions);
    } catch (err: unknown) {
      if (err instanceof BadRequestError) {
        return res.status(400).json({ error: err.message });
      } else if (err instanceof UnauthorizedAccessError) {
        console.error("User is not authorized to access saving", err);
        return res
          .status(401)
          .json({ error: "User is not authorized to access saving" });
      } else {
        console.error("Saving access failed", err);
        res.status(500).json({ error: "Saving access failed" });
      }
    }
  },
);
savingRouter.post("/", async (req: Request, res: Response) => {
  try {
    const userId = authenticateJWT(req);
    const savingAccount = await createSavingAccount(req.body, userId);
    res.status(201).json({ data: savingAccount });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedAccessError) {
      console.error("User is not authorized to create saving", err);
      return res
        .status(401)
        .json({ error: "User is not authorized to create saving" });
    } else {
      console.error("Saving creation failed", err);
      res.status(500).json({ error: "Saving creation failed" });
    }
  }
});
savingRouter.post("/projected", async (req: Request, res: Response) => {
  try {
    // const userId = authenticateJWT(req);
    console.log(req.body);
    res.status(200).json({ data: "Projected savings calculated successfully" });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedAccessError) {
      console.error("User is not authorized to create saving", err);
      return res
        .status(401)
        .json({ error: "User is not authorized to create saving" });
    } else {
      console.error("Saving creation failed", err);
      res.status(500).json({ error: "Saving creation failed" });
    }
  }
});
