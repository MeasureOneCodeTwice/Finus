// Component to handle file upload, validation, and error display for CSV files
//handles one csv file at a time
import React, { useState } from "react";
import CsvDrop from "./CsvDrop";
import CsvFile from "./CsvFile";
import CsvError from "./CsvError";

export default function CsvUpload() {
  const [file, setFile] = useState<File | null>(null);          // selected CSV file
  const [error, setError] = useState<string | null>(null);      // validation errors



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
      setError("File is too large (max 5MB).");
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <CsvDrop onFileSelect={handleFileSelect} />

      {error && <CsvError message={error} />}

      {file && <CsvFile file={file} onRemove={clearFile} />}

      <button disabled={!file} style={{ marginTop: "0.5rem" }}>
        Preview
      </button>
    </div>
  );
}
