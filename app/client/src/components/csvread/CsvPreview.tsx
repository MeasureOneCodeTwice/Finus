// Component to display parsed CSV rows in a preview table

import type { TransactionDraft } from "../../utils/ConvertTransaction";

interface Props {
  rows: TransactionDraft[];
}

export default function CsvPreviewTable({ rows }: Props) {
  // count valid and invalid rows
  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const invalidCount = rows.length - validCount;

  return (
    <div style={{ marginTop: "1rem", color: "#888" }}>
      <div style={{ marginBottom: "0.5rem" }}>
        <strong>Total rows:</strong> {rows.length} <br />
        <strong>Valid rows:</strong> {validCount} <br />
        <strong>Invalid rows:</strong> {invalidCount}
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #ccc",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={cell}>Date</th>
            <th style={cell}>Description</th>
            <th style={cell}>Amount</th>
            <th style={cell}>Sender</th>
            <th style={cell}>Recipient</th>
            <th style={cell}>Category</th>
            <th style={cell}>Errors</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const isInvalid = row.errors.length > 0;

            return (
              <tr
                key={index}
                style={{
                  background: isInvalid ? "#ff0000" : "white", // highlight invalid rows
                }}
              >
                <td style={cell}>{row.date}</td>
                <td style={cell}>{row.description}</td>
                <td style={cell}>{row.amount}</td>
                <td style={cell}>{row.sender}</td>
                <td style={cell}>{row.recipient}</td>
                <td style={cell}>{row.category}</td>
                <td style={cell}>{isInvalid ? row.errors.join(", ") : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
const cell: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "6px 8px",
  fontSize: "0.9rem",
};
