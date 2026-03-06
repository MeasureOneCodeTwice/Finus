// Utility function to normalize row data in a CSV file

export interface NormalizedRow {
  date: string | null;
  description: string | null;
  amount: number | null;
  sender?: string | null;
  recipient?: string | null;
  category?: string | null;
}

export function normalizeRow(raw: unknown): NormalizedRow {
  //row is treated as an object with unknown values
  const record = raw as Record<string, unknown>;

  const clean = (value: unknown): string | null => {
    // helper to trim and clean string-like values
    if (value === undefined || value === null) return null;
    return String(value).trim() || null;
  };
  const rawDate = clean(record.date); // normalize fields using helpers
  const date = normalizeDate(rawDate);
  const rawAmount = clean(record.amount);
  const amount = normalizeAmount(rawAmount);

  return {
    date,
    description: clean(record.description),
    amount,
    sender: clean(record.sender),
    recipient: clean(record.recipient),
    category: clean(record.category),
  };
}

// helper to normalize date formats into YYYY-MM-DD
function normalizeDate(input: string | null): string | null {
  if (!input) return null;

  const data = input.replace(/[.\s]/g, "-").replace(/\//g, "-");

  // Already normalized
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;

  // Matches DD-MM-YYYY or MM-DD-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(data)) {
    const [a, b, y] = data.split("-");

    if (Number(a) > 12) {
      const d = a;
      const m = b;
      return `${y}-${m}-${d}`;
    }

    //assume MM-DD-YYYY
    const m = a;
    const d = b;
    return `${y}-${m}-${d}`;
  }

  return null;
}

// helper to normalize amount fields
function normalizeAmount(input: string | null): number | null {
  if (!input) return null;
  let amount = input.replace(/,/g, "").trim(); //trim
  if (/^\(.+\)$/.test(amount)) {
    //if amount is in parentheses, treat as negative
    amount = "-" + amount.slice(1, -1);
  }
  const num = Number(amount);
  return isNaN(num) ? null : num;
}
