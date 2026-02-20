import mysql from "mysql2/promise";
import express from "express";
import { PORT } from "@/port";
import { onExit } from "@/hooks";
import { buildCorsConfig } from "@/corsUtil";
import { signup, login } from "./logic";
import type { LoginBody, SignupBody } from "./types";
import { parseLoginBody, parseSignupBody } from "./dto";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const app = express();
app.use(express.json());
app.use(buildCorsConfig(undefined));

app.post("/api/auth/signup", async (req, res) => {
  let body: SignupBody;
  try {
    body = parseSignupBody(req.body);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return;
  }

  signup(body, res, pool);
});

app.post("/api/auth/login", async (req, res) => {
  let body: LoginBody;
  try {
    body = parseLoginBody(req.body);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return;
  }

  login(body, res, pool);
});

app.get("/health", (_req, res) => {
  res.send("ok");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, status: "up" });
});

const server = app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

onExit(() => {
  server.close();
  pool.end();
});
