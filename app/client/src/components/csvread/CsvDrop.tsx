//component to upload for CSV files
// import { color } from "chart.js/helpers";
import React, { useState } from "react";

interface CsvDropProps {
  onFileSelect: (file: File | null) => void;
}
// handles drag and drop for CSV file upload
export default function CsvDrop({ onFileSelect }: CsvDropProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    onFileSelect(file || null);
  };
  //accepts only csv files
  return (
    <div
      onDragEnter={() => setIsDragging(true)}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("csv-input")?.click()}
      style={{
        border: "2px dashed #888",
        padding: "1.5rem",
        borderRadius: 8,
        textAlign: "center",
        background: isDragging ? "#eef" : "#fafafa",
        cursor: "pointer",
        marginBottom: "1rem",
        color: "#888",
      }}
    >
      <p>Drag & drop your CSV here, or click to select a file</p>
      <input
        id="csv-input"
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
      />
    </div>
  );
}
