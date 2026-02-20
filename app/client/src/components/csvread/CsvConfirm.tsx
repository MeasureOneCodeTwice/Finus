//shows a summary of parsed CSV data before final import

import type { TransactionDraft } from "../../util/ConvertTransaction";

interface Props {
  rows: TransactionDraft[];
  onConfirm: () => void;
  onBack: () => void;
}

export default function CsvConfirmation({ rows, onConfirm, onBack }: Props) {           // calculates summary stats and displays them along with confirm/back buttons
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);

  const totalIncome = validRows
    .filter(r => (r.amount ?? 0) > 0)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const totalExpenses = validRows
    .filter(r => (r.amount ?? 0) < 0)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3>Summary</h3>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Total rows:</strong> {rows.length} <br />
        <strong>Valid rows:</strong> {validRows.length} <br />
        <strong>Invalid rows:</strong> {invalidRows.length} <br />
        <strong>Total income:</strong> ${totalIncome.toFixed(2)} <br />
        <strong>Total expenses:</strong> ${totalExpenses.toFixed(2)}
      </div>

      <button onClick={onBack} style={{ marginRight: "0.5rem" }}>
        Back
      </button>

      <button onClick={onConfirm}>
        Confirm Import
      </button>
    </div>
  );
}
