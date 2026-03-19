import { getConnectionPool } from "@/sqlUtil.ts";
import type { Pool } from "mysql2/promise";
import type { DebtInfoRequest } from "../types/DebtInfoRequest.ts";

const db = getConnectionPool();
export async function createNewDebt(debt: DebtInfoRequest): Promise<void> {
  const connection: Pool = await db.getConnection();
  /*try {
    await connection.execute(
      "INSERT INTO debts (creditor_id, amount, description) VALUES (?, ?, ?)",
      [debt.creditorId, debt.amount, debt.description],
    );
  } finally {
    connection.release();
  }*/
  console.log(debt)
}