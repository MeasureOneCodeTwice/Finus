import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const db = new Database("app.db");

// Run schema on startup
const schemaPath = join(import.meta.dir, "schema.sql");
const schema = readFileSync(schemaPath, "utf-8");
db.exec(schema);

// Prepared statements
export const stmts = {
  findByEmail: db.prepare(
    "SELECT id, email, password_hash FROM users WHERE email = ?"
  ),

  createUser: db.prepare(
    "INSERT INTO users (email, password_hash) VALUES (?, ?)"
  ),
};
