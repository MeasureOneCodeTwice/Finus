import mysql from "mysql2/promise";
import express from "express";
import { PORT } from "@/port.ts";
import { onExit } from "@/hooks.ts";
import { buildCorsConfig } from "@/corsUtil.ts";
import { signup, login } from "./logic.ts";
import type { LoginBody, SignupBody } from "./types.js";
import { parseLoginBody, parseSignupBody } from "./parsing.ts";

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

app.post("/signup", async (req, res) => {
  let body: SignupBody;
  try {
    body = parseSignupBody(req.body);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return;
  }

  console.log("In Index, calling for signup function");
  signup(body, res, pool);
});

app.post("/login", async (req, res) => {
  let body: LoginBody;
  try {
    body = parseLoginBody(req.body);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return;
  }

  login(body, res, pool);
});

app.get("/health", (_, res) => {
  res.send({ok: true});
});

const server = app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

onExit(async () => {
  await new Promise((res) => server.close(res));
  await pool.end();
  process.exit(0);
});
