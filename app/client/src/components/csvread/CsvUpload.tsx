// Component to handle file upload, validation, and error display for CSV files
//handles one csv file at a time
import { useState } from "react";
import CsvDrop from "./CsvDrop";
import CsvFile from "./CsvFile";
import CsvError from "./CsvError";
import CsvPreviewTable from "./CsvPreview";
import CsvConfirmation from "./CsvConfirm";
import { parseCsvFile } from "../../util/ParseCsv";
import type { TransactionDraft } from "../../util/ConvertTransaction";

export default function CsvUpload() {
  const [file, setFile] = useState<File | null>(null);          // selected CSV file
  const [error, setError] = useState<string | null>(null);      // validation errors
  const [parsedData, setParsedData] = useState<TransactionDraft[] | null>(null);   // state for parsed and validated data
  const [isParsing, setIsParsing] = useState(false);              // track if parsing is in progress
  const [showConfirmation, setShowConfirmation] = useState(false);



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

    if (selected.size > 5 * 1024 * 1024) {        // limit file size to 5MB
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

  const handlePreview = async () => {     // parses the file and updates state with results
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const rows = await parseCsvFile(file);      // returns array of transaction drafts with validation errors if any  

      if (rows.length === 0) {
        setError("CSV contains no readable rows.");
        setParsedData(null);
      } else {
        setParsedData(rows);
      }
    } catch (err: Error | unknown) {    // handle parsing errors
      setError("Failed to parse CSV: " + (err instanceof Error ? err.message : String(err)));
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
        financialAccount_id: 1,     // TODO: replace with real account ID
        transactions: parsedData
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Import failed");
      return;
    }

    console.log("Import success:", result);
    // TODO: show success UI or redirect
  } catch (err) {
    setError("Network error during import");
  }
};



  return (
  <div style={{ marginTop: "1rem" }}>
    <CsvDrop onFileSelect={handleFileSelect} />

    {error && <CsvError message={error} />}

    {file && <CsvFile file={file} onRemove={clearFile} />}

    {/* only show preview button if we have a file and we're not already in confirmation step */}
    {!showConfirmation && (
      <button
        disabled={!file || isParsing}
        onClick={handlePreview}
        style={{ marginTop: "0.5rem" }}
      >
        {isParsing ? "Currently parsing" : "Preview"}
      </button>
    )}

    {/* show preview table and continue button if we have parsed data and we're not in confirmation step */}
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

    {/* show confirmation step */}
    {parsedData && parsedData.length > 0 && showConfirmation && (
      <CsvConfirmation
        rows={parsedData}
        onBack={() => setShowConfirmation(false)}
        onConfirm={handleImport}   // send to backend
      />
    )}
  </div>
);
}