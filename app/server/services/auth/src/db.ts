import { readFileSync } from 'node:fs'
import mysql, {
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from 'mysql2/promise'

type DbUser = {
  id: number
  name: string
  email: string
  password_hash: string
}

type AccountWithCredentialRow = RowDataPacket & {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  pw_hash: Buffer | string
}

function resolveDbPassword(): string {
  const inlinePassword = process.env.DB_PASSWORD
  if (inlinePassword) {
    return inlinePassword
  }

  const passwordFile = process.env.DB_PASSWORD_FILE
  if (passwordFile) {
    return readFileSync(passwordFile, 'utf-8').trim()
  }

  return 'password'
}

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'database',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'finus_app',
  password: resolveDbPassword(),
  database: process.env.DB_NAME ?? 'finus',
  waitForConnections: true,
  connectionLimit: 10,
})

const INIT_RETRIES = 30
const INIT_DELAY_MS = 1000

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let initPromise: Promise<void> | null = null

async function initializeSchema() {
  await pool.execute(`
CREATE TABLE IF NOT EXISTS finusAccount (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_finus_account_email (email)
)
`)

  await pool.execute(`
CREATE TABLE IF NOT EXISTS credentials (
  finus_account_id INT NOT NULL,
  pw_hash BLOB(256) NOT NULL,
  salt CHAR(8) NOT NULL,
  PRIMARY KEY (finus_account_id),
  FOREIGN KEY (finus_account_id) REFERENCES finusAccount(id) ON DELETE CASCADE
)
`)
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      let lastError: unknown = null

      for (let attempt = 1; attempt <= INIT_RETRIES; attempt += 1) {
        try {
          await initializeSchema()
          return
        } catch (error) {
          lastError = error
          if (attempt < INIT_RETRIES) {
            await wait(INIT_DELAY_MS)
          }
        }
      }

      throw lastError
    })()
  }

  await initPromise
}

function buildDisplayName(firstName: string, lastName: string, username: string): string {
  const fullName = `${firstName} ${lastName}`.trim()
  if (!fullName) {
    return username
  }

  return fullName
}

function hashToString(hash: Buffer | string): string {
  if (typeof hash === 'string') {
    return hash
  }

  return hash.toString('utf-8')
}

async function findUserByEmail(email: string): Promise<DbUser | null> {
  await ensureInitialized()

  const [rows] = await pool.execute<AccountWithCredentialRow[]>(
    `
SELECT
  a.id,
  a.username,
  a.email,
  a.first_name,
  a.last_name,
  c.pw_hash
FROM finusAccount a
JOIN credentials c ON c.finus_account_id = a.id
WHERE a.email = ?
LIMIT 1
`,
    [email]
  )

  const row = rows[0]
  if (!row) {
    return null
  }

  return {
    id: row.id,
    name: buildDisplayName(row.first_name, row.last_name, row.username),
    email: row.email,
    password_hash: hashToString(row.pw_hash),
  }
}

async function createUser(
  username: string,
  firstName: string,
  lastName: string,
  email: string,
  passwordHash: string
): Promise<DbUser> {
  await ensureInitialized()

  const salt = Math.random().toString(36).slice(2, 10).padEnd(8, '0').slice(0, 8)

  let connection: PoolConnection | null = null

  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [accountInsert] = await connection.execute<ResultSetHeader>(
      `
INSERT INTO finusAccount (username, email, first_name, last_name)
VALUES (?, ?, ?, ?)
`,
      [username, email, firstName, lastName]
    )

    await connection.execute(
      `
INSERT INTO credentials (finus_account_id, pw_hash, salt)
VALUES (?, ?, ?)
`,
      [accountInsert.insertId, passwordHash, salt]
    )

    await connection.commit()

    return {
      id: accountInsert.insertId,
      name: buildDisplayName(firstName, lastName, username),
      email,
      password_hash: passwordHash,
    }
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }

    throw error
  } finally {
    connection?.release()
  }
}

async function closeDatabase() {
  await pool.end()
}

export type { DbUser }
export { closeDatabase, createUser, findUserByEmail }
