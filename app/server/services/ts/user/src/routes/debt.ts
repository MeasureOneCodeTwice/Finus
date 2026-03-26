import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { pool } from "../db.ts"; 
import type { financialAccount } from "@/types.js";
import { authenticateJWT } from "../handleJWT.js";
import { UnauthorizedAccessError } from "../types/UnauthorizedAccess.ts";
import { advancedPayoffCalculation, calculateExpectedPayOffDates, createNewDebt, getDebts } from "../logic/debt.ts";
import { BadRequestError } from "../types/BadRequestError.ts";
export const debtRouter = Router();

debtRouter.get("/", async (req: Request, res: Response) => {
    try {
        const userId = authenticateJWT(req);
        getDebts(userId).then((debts) => {
            res.status(200).json(debts);
        });
    } catch (err: any) {
        switch (err.constructor) {
            case UnauthorizedAccessError:
                console.error("User is not authorized to access debt", err);
                return res.status(401).json({ error: "User is not authorized to access debt" });
            default:
                console.error("Debt access failed", err);
                res.status(500).json({ error: "Debt access failed" });
        }
    }
});
debtRouter.post("/", async (req: Request, res: Response) => {
    try {
        const userId = authenticateJWT(req);
        const newDebt = await createNewDebt(req.body, userId);
        res.status(201).json({ message: "Debt created successfully", data: newDebt });
    } catch (err: any) {
        switch (err.constructor) {
            case UnauthorizedAccessError:
                console.error("User is not authorized to create debt", err);
                return res.status(401).json({ error: "User is not authorized to create debt" });
            default:
                console.error("Debt creation failed", err);
                res.status(500).json({ error: "Debt creation failed" });
        }
    }
});
debtRouter.post("/predict-payoff", async (req: Request, res: Response) => {

    try {
        const userId = authenticateJWT(req);
        const payoffPrediction = advancedPayoffCalculation(req.body);
        res.status(200).json(payoffPrediction);
    } catch (err: any) {
        switch (err.constructor) {
            case BadRequestError:
                return res.status(400).json({error: err.message})
            case UnauthorizedAccessError:
                console.error("User is not authorized to create debt", err);
                return res.status(401).json({ error: "User is not authorized to create debt" });
            default:
                console.error(err);
                res.status(500).json({ error: "Debt payoff calculation failed" });
        }
    }
});