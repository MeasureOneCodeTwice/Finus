import { getConnectionPool } from "@/sqlUtil.ts";
import type { Pool } from "mysql2/promise";
import type { ResultSetHeader } from "mysql2";
import { FinancialAccountType } from "../types/FinancialAccountType.ts";
import type { SavingInfoRequest } from "../types/SavingInfoRequest.ts";
import type { SavingInfoResponse } from "../types/SavingInfoResponse.ts";
const db = getConnectionPool();

export async function createNewSavingAccount(savingInfo: SavingInfoRequest, userId: string) : Promise<SavingInfoResponse>{
    const { name, balance, accountType, interestRate } = savingInfo;
    const sql = "INSERT INTO financialAccount (name, type, balance, value, subtype) VALUES (?, ?, ?, ?)";
    const params = [name, FinancialAccountType.SAVINGS, balance, 1, accountType];
    try {
        const result = await db.execute(sql, params) as ResultSetHeader | null;
        console.log(result);

        if (!result || result.affectedRows === 0) {
            throw new Error("Failed to create a new saving account.");
        }

        await db.execute("INSERT INTO profile_financialAccount (profile_id, financialAccount_id) VALUES (?, ?)", [userId, result.insertId]);

        return {
            id: Number(result.insertId),
            name: result.name,
            balance: result.balance,
            value: result.value,
            lastUpdated: new Date(result.last_updated).toISOString(),
            accountType: result.type,  
            subType: result.subtype,
        } as SavingInfoResponse;
    } catch (err) {
        console.error("Error creating a new saving account: ", err);
        throw err;
    }
}

