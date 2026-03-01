//util function to show success message after import
export default function SuccessScreen({
  inserted,
  skipped,
  onDone
}: {
  inserted: number;
  skipped: number;
  onDone: () => void;
}) {
  return (
    <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
      <h3>Import Complete</h3>
      <p>{inserted} transactions imported successfully.</p>
      <p>{skipped} rows were skipped due to validation errors.</p>

      <button style={{ marginTop: "1rem" }} onClick={onDone}>
        Done
      </button>
    </div>
  );
}
