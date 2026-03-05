import { describe, it, expect, beforeEach } from "vitest";
import {
  parseCsvImportBody,
  type CsvImportBody,
} from "../src/utils/csvImportBody";

let csvBody: CsvImportBody;

beforeEach(() => {
  csvBody = {
    financialAccount_id: 123,
    transactions: [
      {
        amount: 100,
        description: "Groceries",
        sender: "Walmart",
        recipient: "",
        date: "2026-03-05",
        category: "Food",
        errors: [],
      },
      {
        amount: 50,
        description: "Coffee",
        sender: "Starbucks",
        recipient: "",
        date: "2026-03-04",
        category: "Food",
        errors: [],
      },
    ],
  };
});

describe("parseCsvImportBody tests", () => {
  it("Accept a valid CSV import body", () => {
    const parsed = parseCsvImportBody(csvBody);
    expect(parsed.financialAccount_id).toBe(123);
    expect(parsed.transactions.length).toBe(2);
  });

  it("Convert a financialAccount_id to a number", () => {
    const modified = {
      ...csvBody,
      financialAccount_id: "123",
    } as unknown as CsvImportBody;

    const parsed = parseCsvImportBody(modified);
    expect(parsed.financialAccount_id).toBe(123);
  });

  it("For missing financialAccount_id", () => {
    const invalid = { ...csvBody } as Record<string, unknown>;
    delete invalid.financialAccount_id;

    expect(() =>
      parseCsvImportBody(invalid as unknown as CsvImportBody),
    ).toThrowError();
  });

  it("Throw for iff transactions is not an array", () => {
    const invalid = {
      ...csvBody,
      transactions: "not-an-array",
    } as unknown as CsvImportBody;

    expect(() => parseCsvImportBody(invalid)).toThrowError();
  });

  it("shows that we preserve transaction rows exactly", () => {
    const parsed = parseCsvImportBody(csvBody);
    expect(parsed.transactions).toEqual(csvBody.transactions);
  });

  it("Allows empty transactions array", () => {
    const modified = {
      ...csvBody,
      transactions: [],
    };

    const parsed = parseCsvImportBody(modified);
    expect(parsed.transactions).toEqual([]);
  });

  it("Throw on missing body", () => {
    expect(() =>
      parseCsvImportBody(undefined as unknown as CsvImportBody),
    ).toThrowError();
  });

  it("Doesn't modify the original body", () => {
    const original = structuredClone(csvBody);
    parseCsvImportBody(csvBody);
    expect(csvBody).toEqual(original);
  });

  it("Allows additional fields without throwing", () => {
    const modified = {
      ...csvBody,
      extraField: "ignored",
    } as unknown as CsvImportBody;

    const parsed = parseCsvImportBody(modified);
    expect(parsed.financialAccount_id).toBe(123);
  });

  it("Handle numeric financialAccount_id", () => {
    const modified = {
      ...csvBody,
      financialAccount_id: 999,
    };

    const parsed = parseCsvImportBody(modified);
    expect(parsed.financialAccount_id).toBe(999);
  });
});
