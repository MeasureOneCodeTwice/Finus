//This displays file name, size, and a remove 

import React from "react";

interface CsvFileProps {
  file: File;
  onRemove: () => void;
}

export default function CsvFile({ file, onRemove }: CsvFileProps) {
  return (
    <div
      style={{
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: 6,
        background: "#f9f9f9",
        marginBottom: "1rem"
      }}
    >
      <strong>{file.name}</strong>
      <div>{(file.size / 1024).toFixed(1)} KB</div>

      <button
        onClick={onRemove}
        style={{
          marginTop: "0.5rem",
          background: "#d9534f",
          color: "white",
          border: "none",
          padding: "0.4rem 0.8rem",
          borderRadius: 4,
          cursor: "pointer"
        }}
      >
        Remove
      </button>
    </div>
  );
}
