import cors from "cors";

const defaultMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"];
const origins = [
  "http://localhost",
  "http://localhost:8080",
  "http://18.190.215.135", //prod webserver
  "http://3.142.125.202", //dev webserver
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
