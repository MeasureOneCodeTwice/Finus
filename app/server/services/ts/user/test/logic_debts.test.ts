import { vi, describe, expect, it, beforeEach } from "vitest";
import type { Pool, PoolConnection } from "mysql2/promise";
import { findDebtsBy, addDebt } from "../src/queries/debt.ts";
import { FinancialAccountType } from "../src/types/FinancialAccountType.ts";
import type { FinancialAccountRequest } from "../src/types/FinancialAccountRequest.ts";

describe("findDebtsBy", () => {
  const subtype = "Loan"
  it("should return mapped debt accounts", async () => {
    // Setup fake data
    const mockRows = [
      {
        id: "1",
        name: "Debt A",
        balance: 1000,
        subtype: subtype,
        last_updated: "2022-10-17T00:00:00.000Z",
      },
      {
        id: "2",
        name: "Debt B",
        balance: 9000,
        subtype: subtype,
        last_updated: "2026-02-08T19:00:00.000Z",
      },
    ];

    const mockDb = {
      execute: vi.fn().mockResolvedValue([mockRows]),
    } as unknown as Pool;

    const result = await findDebtsBy(mockDb, "30");

    // Assert
    expect(mockDb.execute).toHaveBeenCalled();

    expect(result.length).toEqual(2)
    expect(result[0]).toEqual(
      {
        id: 1,
        name: "Debt A",
        balance: 1000,
        type: FinancialAccountType.CREDIT,
        subtype: subtype,
        lastUpdated: new Date("2022-10-17T00:00:00.000Z").toISOString(),
      },
    );
    expect(result[1]).toEqual(
      {
        id: 2,
        name: "Debt B",
        balance: 9000,
        type: FinancialAccountType.CREDIT,
        subtype: subtype,
        lastUpdated: new Date("2026-02-08T19:00:00.000Z").toISOString(),
      },
    );
  });

  it("should return empty array if no rows", async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue([[]]),
    } as unknown as Pool;

    const result = await findDebtsBy(mockDb, "20");

    expect(result).toEqual([]);
  });

  it("should handle null/invalid last_updated safely", async () => {
    const mockRows = [
      {
        id: "3",
        name: "Debt C",
        balance: 500,
        type: FinancialAccountType.CREDIT,
        subtype: subtype,
        last_updated: null,
      },
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
      ["1"]
    );
  });
});

describe("addDebt", () => {
  let mockConnection: Partial<PoolConnection>;
  let mockDb: Partial<Pool>;

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

  const newDebts : FinancialAccountRequest = {
    name: "Testing Debt Financial Account",
    type: FinancialAccountType.CREDIT,
    balance: 1000,
    value: 1000,
    subtype: "Loan",
  };
  
  const userId = "10"

  it("should insert debt account and link profiles", async () => {
    (mockConnection.execute as any)
      // INSERT financialAccount
      .mockResolvedValueOnce([{ insertId: 10 }])
      // SELECT profiles
      .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]]);

    (mockConnection.query as any).mockResolvedValueOnce([]);

    const result = await addDebt(
      mockDb as Pool,
      newDebts,
      userId
    );

    // Assert
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.execute).toHaveBeenCalledTimes(2);
    expect(mockConnection.query).toHaveBeenCalled(); 
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();

    expect(result.id).toBe(10);
    expect(result.name).toBe("Testing Debt Financial Account");
    expect(result.balance).toBe(1000);
  });

  // Should not insert into link table due to no profile found
  it("should skip linking if no profiles found", async () => {
    (mockConnection.execute as any)
      .mockResolvedValueOnce([{ insertId: 20 }])
      .mockResolvedValueOnce([[]]); // no profiles

    const result = await addDebt(
      mockDb as Pool,
      newDebts,
      userId
    );

    expect(mockConnection.query).not.toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(result.id).toBe(20);
  });

  // Should rollback on error
  it("should rollback if any query fails", async () => {
    (mockConnection.execute as any)
      .mockResolvedValueOnce([{ insertId: 30 }])
      .mockRejectedValueOnce(new Error("DB error")); // fail on profile query

    await expect(
      addDebt(mockDb as Pool, newDebts, userId)
    ).rejects.toThrow("DB error");

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.commit).not.toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });

  // Should call queries with correct params
  it("should call INSERT with correct values", async () => {
    (mockConnection.execute as any)
      .mockResolvedValueOnce([{ insertId: 40 }])
      .mockResolvedValueOnce([[]]);

    await addDebt(mockDb as Pool, newDebts, "user-1");

    expect(mockConnection.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO finus.financialAccount"),
      [
        newDebts.name,
        newDebts.type,
        newDebts.balance,
        newDebts.value,
        newDebts.subtype,
      ]
    );
  });
});