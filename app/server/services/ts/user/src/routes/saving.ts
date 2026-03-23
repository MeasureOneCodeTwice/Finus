import { Router } from "express";
import type { Request, Response } from "express";
import { authenticateJWT } from "../handleJWT.js";
import { UnauthorizedAccessError } from "../types/UnauthorizedAccess.ts";
import { createSavingAccount, getSavings } from "../logic/saving.ts";
export const savingRouter = Router();

savingRouter.get("/", async (req: Request, res: Response) => {
    try {
        const userId = authenticateJWT(req);
        const savings = await getSavings(userId)
        res.status(200).json({ data: savings})
    } catch (err: any) {
        switch (err.constructor) {
            case UnauthorizedAccessError:
                console.error("User is not authorized to access saving", err);
                return res.status(401).json({ error: "User is not authorized to access saving" });
            default:
                console.error("Saving access failed", err);
                res.status(500).json({ error: "Saving access failed" });
        }
    }
});
savingRouter.post("/", async (req: Request, res: Response) => {
    try {
        const userId = authenticateJWT(req);
        const savingAccount = await createSavingAccount(req.body, userId);
        res.status(201).json({ data: savingAccount });
    } catch (err: any) {
        switch (err.constructor) {
            case UnauthorizedAccessError:
                console.error("User is not authorized to create saving", err);
                return res.status(401).json({ error: "User is not authorized to create saving" });
            default:
                console.error("Saving creation failed", err);
                res.status(500).json({ error: "Saving creation failed" });
        }
    }
});
savingRouter.post("/projected", async (req: Request, res: Response) => {
    try {
        const userId = authenticateJWT(req);
        console.log(req.body)
        res.status(200).json({ data: "Projected savings calculated successfully" });
    } catch (err: any) {
        switch (err.constructor) {
            case UnauthorizedAccessError:
                console.error("User is not authorized to create saving", err);
                return res.status(401).json({ error: "User is not authorized to create saving" });
            default:
                console.error("Saving creation failed", err);
                res.status(500).json({ error: "Saving creation failed" });
        }
    }
});