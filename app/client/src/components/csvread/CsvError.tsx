//component to show parsing errors

interface CsvErrorProps {
  message: string;
}

export default function CsvError({ message }: CsvErrorProps) {
  return (
    <div
      style={{
        padding: "0.75rem",
        borderRadius: 6,
        background: "#ffe5e5",
        color: "#b30000",
        border: "1px solid #ffb3b3",
        marginBottom: "1rem"
      }}
    >
      {message}
    </div>
  );
}

