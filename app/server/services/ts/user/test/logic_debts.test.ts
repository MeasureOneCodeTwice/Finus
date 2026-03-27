import { vi, describe, expect, it, beforeEach } from "vitest";
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { findDebtsBy, addDebt } from "../src/queries/debt.ts";
import type { FinancialAccountType } from "../src/types/FinancialAccountType.ts";
import type { FinancialAccountRequest } from "../src/types/FinancialAccountRequest.ts";

// Define the row structure from the database
interface DebtRow extends RowDataPacket {
  id: string;
  name: string;
  balance: number;
  subtype: string;
  last_updated: string | null;
}

interface ProfileRow extends RowDataPacket {
  id: number;
}

describe("findDebtsBy", () => {
  const subtype = "Loan";

  it("should return mapped debt accounts", async () => {
    const mockRows: DebtRow[] = [
      {
        id: "1",
        name: "Debt A",
        balance: 1000,
        subtype: subtype,
        last_updated: "2022-10-17T00:00:00.000Z",
      } as DebtRow,
      {
        id: "2",
        name: "Debt B",
        balance: 9000,
        subtype: subtype,
        last_updated: "2026-02-08T19:00:00.000Z",
      } as DebtRow,
    ];

    const mockDb = {
      execute: vi.fn().mockResolvedValue([mockRows]),
    } as unknown as Pool;

    const result = await findDebtsBy(mockDb, "30");

    expect(mockDb.execute).toHaveBeenCalled();
    expect(result.length).toEqual(2);
    expect(result[0]).toEqual({
      id: 1,
      name: "Debt A",
      balance: 1000,
      type: "Credit" as FinancialAccountType,
      subtype: subtype,
      lastUpdated: new Date("2022-10-17T00:00:00.000Z").toISOString(),
    });
    expect(result[1]).toEqual({
      id: 2,
      name: "Debt B",
      balance: 9000,
      type: "Credit" as FinancialAccountType,
      subtype: subtype,
      lastUpdated: new Date("2026-02-08T19:00:00.000Z").toISOString(),
    });
  });

  it("should return empty array if no rows", async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue([[]]),
    } as unknown as Pool;

    const result = await findDebtsBy(mockDb, "20");
    expect(result).toEqual([]);
  });

  it("should handle null/invalid last_updated safely", async () => {
    const mockRows: DebtRow[] = [
      {
        id: "3",
        name: "Debt C",
        balance: 500,
        subtype: subtype,
        last_updated: null,
      } as DebtRow,
    ];

    const mockDb = {
      execute: vi.fn().mockResolvedValue([mockRows]),
    } as unknown as Pool;

    const result = await findDebtsBy(mockDb, "50");
    expect(result[0]?.lastUpdated).toBe("N/A");
  });

  it("should call DB with correct query and userId", async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue([[]]),
    } as unknown as Pool;

    await findDebtsBy(mockDb, "1");
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      ["1"],
    );
  });
});

describe("addDebt", () => {
  let mockConnection: Partial<PoolConnection>;
  let mockDb: Partial<Pool>;

  // Type for the mock execute results
  interface InsertResult extends ResultSetHeader {
    insertId: number;
  }

  beforeEach(() => {
    mockConnection = {
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
      execute: vi.fn(),
      query: vi.fn(),
    };

    mockDb = {
      getConnection: vi.fn().mockResolvedValue(mockConnection),
    };
  });

  const newDebts: FinancialAccountRequest = {
    name: "Testing Debt Financial Account",
    type: "Credit" as FinancialAccountType,
    balance: 1000,
    value: 1000,
    subtype: "Loan",
  };

  const userId = "10";

  it("should insert debt account and link profiles", async () => {
    const mockExecute = mockConnection.execute as unknown as ReturnType<
      typeof vi.fn
    >;
    const mockQuery = mockConnection.query as unknown as ReturnType<
      typeof vi.fn
    >;

    // Mock INSERT financialAccount
    mockExecute.mockResolvedValueOnce([{ insertId: 10 } as InsertResult]);
    // Mock SELECT profiles
    mockExecute.mockResolvedValueOnce([[{ id: 1 }, { id: 2 }] as ProfileRow[]]);
    mockQuery.mockResolvedValueOnce([]);

    const result = await addDebt(mockDb as Pool, newDebts, userId);

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(mockQuery).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();

    expect(result.id).toBe(10);
    expect(result.name).toBe("Testing Debt Financial Account");
    expect(result.balance).toBe(1000);
  });

  it("should skip linking if no profiles found", async () => {
    const mockExecute = mockConnection.execute as unknown as ReturnType<
      typeof vi.fn
    >;
    const mockQuery = mockConnection.query as unknown as ReturnType<
      typeof vi.fn
    >;

    // INSERT financialAccount succeeds
    mockExecute.mockResolvedValueOnce([{ insertId: 20 } as InsertResult]);
    // SELECT profiles returns empty
    mockExecute.mockResolvedValueOnce([[]]);

    const result = await addDebt(mockDb as Pool, newDebts, userId);

    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(result.id).toBe(20);
  });

  it("should rollback if any query fails", async () => {
    const mockExecute = mockConnection.execute as unknown as ReturnType<
      typeof vi.fn
    >;

    mockExecute.mockResolvedValueOnce([{ insertId: 30 } as InsertResult]);
    // Fail on the next query
    mockExecute.mockRejectedValueOnce(new Error("DB error"));

    await expect(addDebt(mockDb as Pool, newDebts, userId)).rejects.toThrow(
      "DB error",
    );

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.commit).not.toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it("should call INSERT with correct values", async () => {
    const mockExecute = mockConnection.execute as unknown as ReturnType<
      typeof vi.fn
    >;

    mockExecute.mockResolvedValueOnce([{ insertId: 40 } as InsertResult]);
    mockExecute.mockResolvedValueOnce([[]]);

    await addDebt(mockDb as Pool, newDebts, "user-1");

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO finus.financialAccount"),
      [
        newDebts.name,
        newDebts.type,
        newDebts.balance,
        newDebts.value,
        newDebts.subtype,
      ],
    );
  });
});
