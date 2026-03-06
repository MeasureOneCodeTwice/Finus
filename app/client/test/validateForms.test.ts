import { describe, it, expect } from "vitest";
import {
  validateAccountForm,
  validateTransactionForm,
  validateIncomeForm,
} from "../src/utils/ValidateForms";
import { accountCategory } from "../src/enum/AccountCategory";
import { transactionCategory } from "../src/enum/TransactionCategory";
//tests for validateForms functions
function mockFile(): File {
  return new File(["dummy"], "test.csv", { type: "text/csv" });
}

describe("validateAccountForm", () => {
  it("returns true when CSV file is provided (CSV overrides all other checks)", () => {
    const file = mockFile();
    const result = validateAccountForm("My Account", "Checking", 100, file);
    expect(result).toBe(true);
  });

  it("returns true for valid manual account input", () => {
    const validType = Object.values(accountCategory)[0];

    const result = validateAccountForm("My Account", validType, 500);
    expect(result).toBe(true);
  });

  it("returns false when name is missing", () => {
    const validType = Object.values(accountCategory)[0];

    const result = validateAccountForm("", validType, 500);
    expect(result).toBe(false);
  });

  it("returns false for invalid account type", () => {
    const result = validateAccountForm("My Account", "INVALID_TYPE", 100);
    expect(result).toBe(false);
  });

  it("returns false for negative balance", () => {
    const validType = Object.values(accountCategory)[0];

    const result = validateAccountForm("My Account", validType, -10);
    expect(result).toBe(false);
  });

  it("returns false for invalid interest rate", () => {
    const validType = Object.values(accountCategory)[0];

    const result = validateAccountForm(
      "My Account",
      validType,
      100,
      undefined,
      undefined,
      200,
    );
    expect(result).toBe(false);
  });

  it("returns true when optional subtype and interest are valid", () => {
    const validType = Object.values(accountCategory)[0];

    const result = validateAccountForm(
      "My Account",
      validType,
      100,
      undefined,
      "sub",
      5,
    );
    expect(result).toBe(true);
  });
});

describe("validateTransactionForm", () => {
  it("returns true when CSV file is provided", () => {
    const file = mockFile();
    const result = validateTransactionForm(
      123,
      "Deposit",
      100,
      "2024-01-01",
      file,
    );
    expect(result).toBe(true);
  });

  it("returns true for valid manual transaction input", () => {
    const validType = Object.values(transactionCategory)[0];

    const result = validateTransactionForm(123, validType, 50, "2024-01-01");
    expect(result).toBe(true);
  });

  it("returns false when account_id is missing", () => {
    const validType = Object.values(transactionCategory)[0];

    const result = validateTransactionForm(0, validType, 50, "2024-01-01");
    expect(result).toBe(false);
  });

  it("returns false for invalid transaction type", () => {
    const result = validateTransactionForm(
      123,
      "INVALID_TYPE",
      50,
      "2024-01-01",
    );
    expect(result).toBe(false);
  });

  it("returns false for non-positive amount", () => {
    const validType = Object.values(transactionCategory)[0];

    const result = validateTransactionForm(123, validType, 0, "2024-01-01");
    expect(result).toBe(false);
  });

  it("returns false when date is missing", () => {
    const validType = Object.values(transactionCategory)[0];

    const result = validateTransactionForm(123, validType, 50, "");
    expect(result).toBe(false);
  });
});

describe("validateIncomeForm", () => {
  it("returns true for valid name and positive income", () => {
    expect(validateIncomeForm("Job", 1000)).toBe(true);
  });

  it("returns false for missing name", () => {
    expect(validateIncomeForm("", 1000)).toBe(false);
  });

  it("returns false for non-positive income", () => {
    expect(validateIncomeForm("Job", 0)).toBe(false);
  });
});
