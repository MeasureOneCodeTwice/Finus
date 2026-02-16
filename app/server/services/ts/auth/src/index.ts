import { readFileSync } from "node:fs";
import mysql, {
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import express from "express";
import jwt from "jsonwebtoken";
import { PORT } from "@/port";
import { onExit } from "@/hooks";
import { buildCorsConfig } from "@/corsUtil";

type SignupBody = {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  age?: number | string;
};

type LoginBody = {
  email?: string;
  password?: string;
};

type DbUser = {
  id: number;
  name: string;
  email: string;
  age: number;
  password_hash: string;
};

type AccountWithCredentialRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  age: number;
  pw_hash: Buffer | string;
};

type AuthTokenClaims = {
  sub: string;
  email: string;
  name: string;
};

const JWT_SECRET = process.env.AUTH_JWT_SECRET ?? "dev-only-secret";
const MIN_PASSWORD_LENGTH = 8;
const MIN_AGE = 1;
const MAX_AGE = 120;

function resolveDbPassword(): string {
  const inlinePassword = process.env.DB_PASSWORD;
  if (inlinePassword) {
    return inlinePassword;
  }

  const passwordFile = process.env.DB_PASSWORD_FILE;
  if (passwordFile) {
    return readFileSync(passwordFile, "utf-8").trim();
  }

  return "password";
}

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "database",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "finus_app",
  password: resolveDbPassword(),
  database: process.env.DB_NAME ?? "finus",
  waitForConnections: true,
  connectionLimit: 10,
});

const INIT_RETRIES = 30;
const INIT_DELAY_MS = 1000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let initPromise: Promise<void> | null = null;

type ColumnExistsRow = RowDataPacket & {
  column_exists: number;
};

async function ensureAgeColumnExists() {
  const [rows] = await pool.execute<ColumnExistsRow[]>(
    `
SELECT COUNT(*) AS column_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'finusAccount'
  AND COLUMN_NAME = 'age'
`,
  );

  if ((rows[0]?.column_exists ?? 0) === 0) {
    await pool.execute(
      `
ALTER TABLE finusAccount
ADD COLUMN age INT NOT NULL DEFAULT 18
`,
    );
  }
}

async function initializeSchema() {
  await pool.execute(`CREATE DATABASE IF NOT EXISTS finus`);

  await pool.execute(`
CREATE TABLE IF NOT EXISTS finusAccount (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  age INT NOT NULL DEFAULT 18,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

  await pool.execute(`
CREATE TABLE IF NOT EXISTS credentials (
  finus_account_id INT NOT NULL,
  pw_hash BLOB(256) NOT NULL,
  salt CHAR(8) NOT NULL,
  PRIMARY KEY (finus_account_id),
  FOREIGN KEY (finus_account_id) REFERENCES finusAccount(id) ON DELETE CASCADE
)
`);

  await ensureAgeColumnExists();
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= INIT_RETRIES; attempt += 1) {
        try {
          await initializeSchema();
          return;
        } catch (error) {
          lastError = error;
          if (attempt < INIT_RETRIES) {
            await wait(INIT_DELAY_MS);
          }
        }
      }

      throw lastError;
    })();
  }

  await initPromise;
}

function buildDisplayName(firstName: string, lastName: string, username: string): string {
  const fullName = `${firstName} ${lastName}`.trim();
  if (!fullName) {
    return username;
  }

  return fullName;
}

function hashToString(hash: Buffer | string): string {
  if (typeof hash === "string") {
    return hash;
  }

  return hash.toString("utf-8");
}

function validatePassword(password: string): boolean {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  return password.length >= MIN_PASSWORD_LENGTH && hasLetter && hasDigit;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

async function findUserByEmail(email: string): Promise<DbUser | null> {
  await ensureInitialized();

  const [rows] = await pool.execute<AccountWithCredentialRow[]>(
    `
SELECT
  a.id,
  a.username,
  a.email,
  a.first_name,
  a.last_name,
  a.age,
  c.pw_hash
FROM finusAccount a
JOIN credentials c ON c.finus_account_id = a.id
WHERE a.email = ?
LIMIT 1
`,
    [email],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: buildDisplayName(row.first_name, row.last_name, row.username),
    email: row.email,
    age: row.age,
    password_hash: hashToString(row.pw_hash),
  };
}

async function createUser(
  username: string,
  firstName: string,
  lastName: string,
  email: string,
  age: number,
  passwordHash: string,
): Promise<DbUser> {
  await ensureInitialized();

  const salt = Math.random().toString(36).slice(2, 10).padEnd(8, "0").slice(0, 8);

  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [accountInsert] = await connection.execute<ResultSetHeader>(
      `
INSERT INTO finusAccount (username, email, first_name, last_name, age)
VALUES (?, ?, ?, ?, ?)
`,
      [username, email, firstName, lastName, age],
    );

    await connection.execute(
      `
INSERT INTO credentials (finus_account_id, pw_hash, salt)
VALUES (?, ?, ?)
`,
      [accountInsert.insertId, passwordHash, salt],
    );

    await connection.commit();

    return {
      id: accountInsert.insertId,
      name: buildDisplayName(firstName, lastName, username),
      email,
      age,
      password_hash: passwordHash,
    };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection?.release();
  }
}

function authResponseUser(user: DbUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    age: user.age,
  };
}

function issueToken(user: DbUser): string {
  const payload: AuthTokenClaims = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

async function closeDatabase() {
  await pool.end();
}

const app = express();
app.use(express.json());
app.use(buildCorsConfig(undefined));

function parseAge(age: number | string | undefined): number | null {
  const parsedAge = typeof age === "string" ? Number(age.trim()) : age;
  if (typeof parsedAge !== "number" || !Number.isInteger(parsedAge)) {
    return null;
  }

  return parsedAge;
}

app.post("/api/auth/signup", async (req, res) => {
  try {
    const body = req.body as SignupBody;
    const username = body.username?.trim();
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const hasAgeValue =
      body.age !== undefined && body.age !== null && String(body.age).trim().length > 0;
    const age = parseAge(body.age);

    if (!username || !firstName || !lastName || !email || !password || !hasAgeValue) {
      res.status(400).json({
        ok: false,
        error: "Username, first name, last name, age, email and password are required.",
      });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ ok: false, error: "Please enter a valid email address." });
      return;
    }

    if (age === null || age < MIN_AGE || age > MAX_AGE) {
      res.status(400).json({
        ok: false,
        error: `Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}.`,
      });
      return;
    }

    if (!validatePassword(password)) {
      res.status(400).json({
        ok: false,
        error: "Password must be at least 8 characters and include letters and numbers.",
      });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ ok: false, error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(username, firstName, lastName, email, age, passwordHash);
    const token = issueToken(user);

    res.status(201).json({
      ok: true,
      message: "Account created.",
      token,
      user: authResponseUser(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    res.status(500).json({ ok: false, error: message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const body = req.body as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      res.status(400).json({ ok: false, error: "Email and password are required." });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ ok: false, error: "Please enter a valid email address." });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ ok: false, error: "Invalid email or password." });
      return;
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ ok: false, error: "Invalid email or password." });
      return;
    }

    const token = issueToken(user);

    res.status(200).json({
      ok: true,
      message: "Logged in.",
      token,
      user: authResponseUser(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to log in.";
    res.status(500).json({ ok: false, error: message });
  }
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
  void closeDatabase();
});
