import { describe, it, expect } from "vitest";
import { normalizeRow } from "../src/utils/NormalizeRow";
//tests for normalizeRow function we can run with vitest
describe("normalizeRow", () => {
  it("normalizes a fully valid row", () => {
    const raw = {
      date: "2024-01-15",
      description: " Test transaction ",
      amount: "100.50",
      sender: " Joe ",
      recipient: " Bob ",
      category: " Food ",
    };

    const result = normalizeRow(raw);

    expect(result).toEqual({
      date: "2024-01-15",
      description: "Test transaction",
      amount: 100.5,
      sender: "Joe",
      recipient: "Bob",
      category: "Food",
    });
  });

  it("handles null and undefined fields", () => {
    const raw = {
      date: null,
      description: undefined,
      amount: null,
      sender: undefined,
      recipient: null,
      category: undefined,
    };

    const result = normalizeRow(raw);

    expect(result).toEqual({
      date: null,
      description: null,
      amount: null,
      sender: null,
      recipient: null,
      category: null,
    });
  });
  //tests for different date formats
  it("normalizes MM-DD-YYYY date format", () => {
    const raw = { date: "01-31-2024" };
    const result = normalizeRow(raw);
    expect(result.date).toBe("2024-01-31");
  });
  //tests for invalid date formats
  it("returns null for invalid dates", () => {
    const raw = { date: "not-a-date" };
    const result = normalizeRow(raw);
    expect(result.date).toBeNull();
  });
  //tests for amount normalization
  it("normalizes positive amounts", () => {
    const raw = { amount: "1,234.56" };
    const result = normalizeRow(raw);
    expect(result.amount).toBe(1234.56);
  });
  //tests for negative amounts with minus sign
  it("normalizes negative amounts in parentheses", () => {
    const raw = { amount: "(500.00)" };
    const result = normalizeRow(raw);
    expect(result.amount).toBe(-500);
  });
  //tests for null amount
  it("returns null for invalid amounts", () => {
    const raw = { amount: "abc" };
    const result = normalizeRow(raw);
    expect(result.amount).toBeNull();
  });
  //tests for trimming string fields
  it("trims all string fields", () => {
    const raw = {
      description: "   rent payment   ",
      sender: "   joe   ",
      recipient: "   bob   ",
      category: "   misc   ",
    };

    const result = normalizeRow(raw);

    expect(result.description).toBe("rent payment");
    expect(result.sender).toBe("joe");
    expect(result.recipient).toBe("bob");
    expect(result.category).toBe("misc");
  });
});
it("normalizes dates with dots", () => {
  const raw = { date: "2024.01.15" };
  const result = normalizeRow(raw);
  expect(result.date).toBe("2024-01-15");
});

it("normalizes dates with slashes", () => {
  const raw = { date: "2024/01/15" };
  const result = normalizeRow(raw);
  expect(result.date).toBe("2024-01-15");
});

it("normalizes dates with spaces", () => {
  const raw = { date: "2024 01 15" };
  const result = normalizeRow(raw);
  expect(result.date).toBe("2024-01-15");
});

it("rejects parentheses amounts with extra characters before", () => {
  const raw = {
    date: "2024-01-01",
    description: "",
    amount: "X(500.00)",
    sender: "",
    recipient: "",
    category: "",
  };
  const result = normalizeRow(raw);
  expect(result.amount).toBeNull();
});

it("rejects parentheses amounts with extra characters after", () => {
  const raw = {
    date: "2024-01-01",
    description: "",
    amount: "(500.00)X",
    sender: "",
    recipient: "",
    category: "",
  };
  const result = normalizeRow(raw);
  expect(result.amount).toBeNull();
});

it("rejects MM-DD-YYYY with extra characters before", () => {
  const raw = { date: "X01-31-2024" };
  const result = normalizeRow(raw);
  expect(result.date).toBeNull();
});

it("rejects MM-DD-YYYY with extra characters after", () => {
  const raw = { date: "01-31-2024X" };
  const result = normalizeRow(raw);
  expect(result.date).toBeNull();
});
it("pads single-digit month and day", () => {
  const raw = { date: "1-2-2024" };
  const result = normalizeRow(raw);
  expect(result.date).toBe("2024-01-02");
});

it("trims whitespace around amount", () => {
  const raw = { amount: "   123.45   " };
  const result = normalizeRow(raw);
  expect(result.amount).toBe(123.45);
});

it("parses negative parentheses amounts with leading whitespace", () => {
  const raw = {
    date: "2024-01-01",
    description: "",
    amount: "   (500.00)",
    sender: "",
    recipient: "",
    category: "",
  };

  const result = normalizeRow(raw);
  expect(result.amount).toBe(-500);
});

it("rejects YYYY-MM-DD with leading garbage", () => {
  const raw = { date: "X2024-01-15" };
  const result = normalizeRow(raw);
  expect(result.date).toBeNull();
});

it("rejects YYYY-MM-DD with trailing garbage", () => {
  const raw = { date: "2024-01-15X" };
  const result = normalizeRow(raw);
  expect(result.date).toBeNull();
});
