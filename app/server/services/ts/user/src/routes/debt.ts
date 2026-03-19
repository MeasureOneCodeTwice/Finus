import { Router } from "express";
import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { getConnectionPool } from "@/sqlUtil";
import type { financialAccount } from "@/types.js";
import { authenticateJWT } from "../handleJWT.js";
import { UnauthorizedAccessError } from "../types/UnauthorizedAccess.ts";
import { createNewDebt } from "../logic/debt.ts";
export const debtRouter = Router();

const db = getConnectionPool();

debtRouter.get("/", async (req: Request, res: Response) => {
    try {
        const userId = authenticateJWT(req);
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
        await createNewDebt(req.body);
        res.status(201).json({ message: "Debt created successfully" });
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