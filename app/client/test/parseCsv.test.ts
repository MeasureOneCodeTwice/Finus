import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import Papa from "papaparse";
import { parseCsvFile } from "../src/utils/ParseCsv";
import { normalizeRow } from "../src/utils/NormalizeRow";
import {
  convertDraft,
  type TransactionDraft,
} from "../src/utils/ConvertTransaction";

vi.mock("papaparse");
vi.mock("../src/utils/NormalizeRow");
vi.mock("../src/utils/ConvertTransaction");

describe("parseCsvFile", () => {
  let mockFile: File;

  beforeEach(() => {
    mockFile = new File(["amount,date"], "test.csv", { type: "text/csv" });
    vi.resetAllMocks();
  });

  it("resolves with converted drafts when CSV is valid", async () => {
    const parsedRows = [{ amount: 100 }, { amount: 50 }];

    (Papa.parse as unknown as Mock).mockImplementation((_file, config) => {
      config.complete?.({
        data: parsedRows,
        errors: [],
        meta: {
          delimiter: ",",
          linebreak: "\n",
          aborted: false,
          truncated: false,
          cursor: 0,
        },
      });
    });

    (normalizeRow as unknown as Mock).mockImplementation((row: unknown) => row);

    (convertDraft as unknown as Mock).mockImplementation(
      (row: unknown): TransactionDraft => ({
        amount: (row as { amount?: number }).amount ?? null,
        description: null,
        sender: null,
        recipient: null,
        date: "2026-03-05",
        category: "Test",
        errors: [],
      }),
    );

    const result = await parseCsvFile(mockFile);

    expect(result.length).toBe(2);
    expect(result[0].amount).toBe(100);
    expect(result[1].amount).toBe(50);
  });

  it("rejects when PapaParse returns errors", async () => {
    (Papa.parse as unknown as Mock).mockImplementation((_file, config) => {
      config.complete?.({
        data: [],
        errors: [{ message: "Malformed CSV" }],
        meta: {
          delimiter: ",",
          linebreak: "\n",
          aborted: false,
          truncated: false,
          cursor: 0,
        },
      });
    });

    await expect(parseCsvFile(mockFile)).rejects.toBe("Malformed CSV");
  });

  it("rejects when PapaParse triggers error callback", async () => {
    (Papa.parse as unknown as Mock).mockImplementation((_file, config) => {
      config.error?.(new Error("File read error"));
    });

    await expect(parseCsvFile(mockFile)).rejects.toBe("File read error");
  });

  it("calls normalizeRow for each parsed row", async () => {
    const parsedRows = [{ a: 1 }, { a: 2 }];

    (Papa.parse as unknown as Mock).mockImplementation((_file, config) => {
      config.complete?.({
        data: parsedRows,
        errors: [],
        meta: {
          delimiter: ",",
          linebreak: "\n",
          aborted: false,
          truncated: false,
          cursor: 0,
        },
      });
    });

    (normalizeRow as unknown as Mock).mockImplementation((row: unknown) => row);

    (convertDraft as unknown as Mock).mockImplementation(
      (row: unknown): TransactionDraft => ({
        amount: (row as { a?: number }).a ?? null,
        description: null,
        sender: null,
        recipient: null,
        date: "2026-03-05",
        category: "Test",
        errors: [],
      }),
    );

    await parseCsvFile(mockFile);

    expect(normalizeRow).toHaveBeenCalledTimes(2);
  });

  it("resolves with an empty array when CSV has no rows", async () => {
    (Papa.parse as unknown as Mock).mockImplementation((_file, config) => {
      config.complete?.({
        data: [],
        errors: [],
        meta: {
          delimiter: ",",
          linebreak: "\n",
          aborted: false,
          truncated: false,
          cursor: 0,
        },
      });
    });

    const result = await parseCsvFile(mockFile);

    expect(result).toEqual([]);
  });
});
