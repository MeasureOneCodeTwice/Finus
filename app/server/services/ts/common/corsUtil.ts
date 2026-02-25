import cors from "cors";

const defaultMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
const defaultOrigin = "http://localhost";
export function buildCorsConfig(
  opts?: { origin?: string; methods?: string[] },
) {
  return cors({
    origin: opts?.origin ?? defaultOrigin,
    methods: opts?.methods ?? defaultMethods,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}
