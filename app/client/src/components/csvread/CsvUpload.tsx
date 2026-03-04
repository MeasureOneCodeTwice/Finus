// Component to handle file upload, validation, and error display for CSV files
//handles one csv file at a time
import { useState } from "react";
import CsvDrop from "./CsvDrop";
import CsvFile from "./CsvFile";
import CsvError from "./CsvError";
import CsvPreviewTable from "./CsvPreview";
import CsvConfirmation from "./CsvConfirm";
import { parseCsvFile } from "../../utils/ParseCsv";
import type { TransactionDraft } from "../../utils/ConvertTransaction";
import SuccessScreen from "./csvSuccess";

export default function CsvUpload({ accountId }: { accountId: number }) {
  const [file, setFile] = useState<File | null>(null); // selected CSV file
  const [error, setError] = useState<string | null>(null); // validation errors
  const [parsedData, setParsedData] = useState<TransactionDraft[] | null>(null); // state for parsed and validated data
  const [isParsing, setIsParsing] = useState(false); // track if parsing is in progress
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [importResult, setImportResult] = useState<null | {
    inserted: number;
    skipped: number;
  }>(null);

  // File Validation
  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;

    // Validate type
    if (!selected.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      setFile(null);
      return;
    }

    // Validate size
    if (selected.size === 0) {
      setError("File is empty.");
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      // limit file size to 5MB
      setError("File is too large (max 5MB).");
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
    setParsedData(null);
    setShowConfirmation(false);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setParsedData(null);
    setShowConfirmation(false);
  };

  const handlePreview = async () => {
    // parses the file and updates state with results
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const rows = await parseCsvFile(file); // returns array of transaction drafts with validation errors if any

      if (rows.length === 0) {
        setError("CSV contains no readable rows.");
        setParsedData(null);
      } else {
        setParsedData(rows);
      }
    } catch (err: Error | unknown) {
      // handle parsing errors
      setError(
        "Failed to parse CSV: " +
          (err instanceof Error ? err.message : String(err)),
      );
      setParsedData(null);
    }

    setIsParsing(false);
  };

  //handle import sends valid transactions to backend for insertion into database
  const handleImport = async () => {
    if (!parsedData) return;

    try {
      const response = await fetch("/api/transactions/csvTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialAccount_id: accountId,
          transactions: parsedData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Import failed");
        return;
      }

      setImportResult({
        inserted: result.inserted,
        skipped: result.skipped,
      });
    } catch (error) {
      console.error("Import failed:", error);
      setError("Error during import");
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      {importResult && (
        <SuccessScreen
          inserted={importResult.inserted}
          skipped={importResult.skipped}
          onDone={() => {
            setImportResult(null);
            setParsedData(null);
            setFile(null);
            setShowConfirmation(false);
          }}
        />
      )}
      {!importResult && (
        <>
          <CsvDrop onFileSelect={handleFileSelect} />

          {error && <CsvError message={error} />}

          {file && <CsvFile file={file} onRemove={clearFile} />}

          {!showConfirmation && (
            <button
              disabled={!file || isParsing}
              onClick={handlePreview}
              style={{ marginTop: "0.5rem" }}
            >
              {isParsing ? "Currently parsing" : "Preview"}
            </button>
          )}

          {parsedData && parsedData.length > 0 && !showConfirmation && (
            <>
              <CsvPreviewTable rows={parsedData} />

              <button
                style={{ marginTop: "1rem" }}
                onClick={() => setShowConfirmation(true)}
              >
                Continue
              </button>
            </>
          )}

          {parsedData && parsedData.length > 0 && showConfirmation && (
            <CsvConfirmation
              rows={parsedData}
              onBack={() => setShowConfirmation(false)}
              onConfirm={handleImport}
            />
          )}
        </>
      )}
    </div>
  );
}
