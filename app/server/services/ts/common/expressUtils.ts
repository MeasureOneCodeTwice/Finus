import cors from "cors";

const defaultMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
const defaultOrigins = ["http://localhost:80", "http://localhost:8080"];
export function buildCorsConfig(opts?: {
  origins?: string | string[];
  methods?: string[];
}) {
  return cors({
    origin: opts?.origin ?? defaultOrigins,
    methods: opts?.methods ?? defaultMethods,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

export async function handleServerError(
  func: () => void,
  res,
  message: string = "Error processing request",
) {
  await func().catch((e) =>
    res.status(500).json({
      message: message ?? e.message,
    }),
  );
}
