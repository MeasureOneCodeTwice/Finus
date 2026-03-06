import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { parseCsvFile } from "../src/utils/ParseCsv";
import Papa, {
  ParseResult,
  ParseError,
  ParseConfig,
  ParseMeta,
} from "papaparse";
import { normalizeRow } from "../src/utils/NormalizeRow";
import { convertDraft } from "../src/utils/ConvertTransaction";

// Extend PapaParse types to match real runtime behavior
type FixedParseConfig<T> = ParseConfig<T> & {
  error?: (err: Error, file?: File) => void;
  complete?: (results: ParseResult<T>, file?: File) => void;
};

vi.mock("papaparse", () => ({
  default: {
    parse: vi.fn(),
  },
}));

// Mock helpers
vi.mock("../src/utils/NormalizeRow", () => ({
  normalizeRow: vi.fn((row) => ({ normalized: row })),
}));

vi.mock("../src/utils/ConvertTransaction", () => ({
  convertDraft: vi.fn((row) => ({ converted: row, errors: [] })),
}));

function mockFile(name: string): File {
  return new File(["dummy"], name, { type: "text/csv" });
}

const mockMeta: ParseMeta = {
  delimiter: ",",
  linebreak: "\n",
  aborted: false,
  truncated: false,
  cursor: 0,
};

describe("parseCsvFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves with converted drafts when parsing succeeds", async () => {
    const file = mockFile("good.csv");
    const mockParse = Papa.parse as unknown as Mock;

    mockParse.mockImplementation(
      (_file: File, config: FixedParseConfig<unknown>) => {
        const result: ParseResult<unknown> = {
          data: [{ a: 1 }, { a: 2 }],
          errors: [],
          meta: mockMeta,
        };

        config.complete?.(result, _file);
      },
    );

    const result = await parseCsvFile(file);

    expect(normalizeRow).toHaveBeenCalledTimes(2);
    expect(convertDraft).toHaveBeenCalledTimes(2);

    expect(result).toEqual([
      { converted: { normalized: { a: 1 } }, errors: [] },
      { converted: { normalized: { a: 2 } }, errors: [] },
    ]);
  });

  it("rejects when Papa.parse returns errors", async () => {
    const file = mockFile("bad.csv");
    const mockParse = Papa.parse as unknown as Mock;

    mockParse.mockImplementation(
      (_file: File, config: FixedParseConfig<unknown>) => {
        const result: ParseResult<unknown> = {
          data: [],
          errors: [{ message: "Parse error" } as ParseError],
          meta: mockMeta,
        };

        config.complete?.(result, _file);
      },
    );

    await expect(parseCsvFile(file)).rejects.toBe("Parse error");
  });

  it("rejects when Papa.parse triggers its error callback", async () => {
    const file = mockFile("error.csv");
    const mockParse = Papa.parse as unknown as Mock;

    mockParse.mockImplementation(
      (_file: File, config: FixedParseConfig<unknown>) => {
        config.error?.(new Error("File read error"), _file);
      },
    );

    await expect(parseCsvFile(file)).rejects.toBe("File read error");
  });

  it("calls Papa.parse with correct config", async () => {
    const file = mockFile("config.csv");
    const mockParse = Papa.parse as unknown as Mock;

    mockParse.mockImplementation(
      (_file: File, config: FixedParseConfig<unknown>) => {
        const result: ParseResult<unknown> = {
          data: [],
          errors: [],
          meta: mockMeta,
        };

        config.complete?.(result, _file);
      },
    );

    await parseCsvFile(file);

    expect(mockParse).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: expect.any(Function),
        error: expect.any(Function),
      }),
    );
  });
});
