import express from "express";
import { PORT } from "@/port";
import { onExit } from "@/hooks";
import { buildCorsConfig, handleServerError } from "@/expressUtils";
import { signup, login } from "./logic";
import type { LoginBody, SignupBody } from "./types";
import { parseLoginBody, parseSignupBody } from "./parsing";
import { getConnectionPool, getDatabaseStatus } from "@/sqlUtil";

const pool = getConnectionPool();
const app = express();
app.use(buildCorsConfig());
app.use(express.json());

app.post("/signup", async (req, res) => {
  let body: SignupBody;
  try {
    body = parseSignupBody(req.body);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return;
  }

  console.log("In Index, calling for signup function");
  handleServerError(() => signup(body, res, pool), res);
});

app.post("/login", async (req, res) => {
  let body: LoginBody;
  try {
    body = parseLoginBody(req.body);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return;
  }

  handleServerError(() => login(body, res, pool), res);
});

app.get("/health", async (_, res) => {
  const status = await getDatabaseStatus();
  res.send(status);
});

const server = app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

onExit(async () => {
  await new Promise((res) => server.close(res));
  await pool.end();
  process.exit(0);
});
