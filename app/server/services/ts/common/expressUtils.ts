import cors from "cors";

const defaultMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"];
const origins = [
  "http://localhost",
  "http://localhost:8080",
  process.env.CORS_ALLOWED_ORIGIN
];

export function buildCorsConfig(opts?: { methods?: string[] }) {
  return cors({
    origin: origins,
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
      message: e.message ?? message,
    }),
  );
}
