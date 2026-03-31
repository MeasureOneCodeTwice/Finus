import { getConnectionPool } from "@/sqlUtil.ts";
import { RowDataPacket } from "mysql2";
import type { PoolConnection, ResultSetHeader, Pool } from "mysql2/promise";
import type { DebtInfoResponse } from "../types/DebtInfoResponse.ts";
import type { FinancialAccountRequest } from "../types/FinancialAccountRequest.ts";
import { FinancialAccountType } from "../types/FinancialAccountType.ts";

export async function findDebtsBy(db: Pool, userId: string) : Promise<DebtInfoResponse[]>{
    const query = `
        SELECT fa.id, fa.name, fa.balance, fa.subtype, fa.last_updated
        FROM finus.financialAccount fa
        JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
        JOIN finus.profile p ON pfa.profile_id = p.id
        JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
        WHERE uap.account_id = ? 
        AND fa.type = 'CREDIT_CARD' 
        AND fa.subtype = 'Loan'
        GROUP BY fa.id
    `;
    
    const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
    console.log(rows)
    const result: DebtInfoResponse[] = rows.map((row) => ({
        id: Number(row.id),
        name: String(row.name),
        balance: Number(row.balance),
        type: FinancialAccountType.CREDIT,
        subtype: String(row.subtype),
        lastUpdated: row.last_updated
            ? new Date(row.last_updated).toISOString()
            : "N/A",
    }));
    return result;
}
export async function addDebt(db: Pool, newDebt: FinancialAccountRequest, userId: string): Promise<DebtInfoResponse> {
   
    const connection : PoolConnection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const query = `INSERT INTO finus.financialAccount  (name, type, balance, value, subtype) VALUES (?, ?, ?, ?, ?)`;
        const params = [newDebt.name, newDebt.type, newDebt.balance, newDebt.value, newDebt.subtype];
        
        const [result] = await connection.execute<ResultSetHeader>(query, params);
        const financialAccountId = result.insertId;

        const profileQuery = `SELECT * from profile p JOIN finusAccount_profile fp on p.id = fp.profile_id where fp.account_id = ?`
        const [profiles] = await connection.execute<RowDataPacket[]>(profileQuery, [userId])

        if (profiles.length > 0) {
            const values = profiles.map((p) => [p.id, financialAccountId]);
            const linkQuery = `INSERT INTO finus.profile_financialAccount (profile_id, financialAccount_id) VALUES ?`;
            await connection.query(linkQuery, [values]);
        }

        await connection.commit();


        console.log("From db", result)
        return {
            id: Number(financialAccountId),
            name: String(newDebt.name),
            balance: Number(newDebt.balance),
            subtype: String(newDebt.subtype),
            lastUpdated: new Date().toISOString().replace("T", " ") ?? "N/A",
        } as DebtInfoResponse;
    } catch (err) {
        // Rollback if anything fails
        await connection.rollback();
        throw err;
    } finally {
        connection.release(); 
    }
}