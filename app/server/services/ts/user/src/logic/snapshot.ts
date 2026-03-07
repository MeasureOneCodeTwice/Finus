import type { Pool } from "mysql2/promise";
import { getSnapshotQuery } from "../queries/snapshot.ts";
import type { SnapshotResponse } from "../types/SnapshotResponse.ts";

export async function getSnapshotData(
  pool: Pool,
  userId: string,
): Promise<SnapshotResponse> {
  const today = new Date();
  const ytdStart = new Date(today.getFullYear(), 0, 1);
  const ytdStartStr = ytdStart.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const monthsPassed = today.getMonth() + 1;

  const results = await getSnapshotQuery(pool, userId, ytdStartStr, todayStr);

  if (!results || results.length === 0) {
    throw new Error("No snapshot data found");
  }

  const data = results[0];
  const avgMonthlyExpenses =
    monthsPassed > 0 ? data.total_expenses / monthsPassed : 0;

  return {
    totalBalance: data.total_balance || 0,
    currentIncome: data.current_income || 0,
    averageExpenses: Math.round(avgMonthlyExpenses * 100) / 100,
    currentDebt: data.current_debt || 0,
    totalSavings: data.total_savings || 0,
  };
}

export async function getSnapshotDataSafe(
  pool: Pool,
  userId: string,
): Promise<SnapshotResponse | null> {
  try {
    return await getSnapshotData(pool, userId);
  } catch (error) {
    console.error("Error in getSnapshotData:", error);
    return null;
  }
}
