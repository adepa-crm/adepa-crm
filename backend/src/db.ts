import Database from "better-sqlite3";
import path from "path";

// This sandbox blocks the network calls Prisma needs to download its
// query engine binary, so the runnable skeleton here uses better-sqlite3
// with plain SQL instead. The shape of these two tables is exactly what's
// described in prisma/schema.prisma — swap this file for a real Prisma
// client (or `pg`) against Postgres when you deploy; the routes don't
// need to change, only how they get a connection.
export const db = new Database(path.join(__dirname, "..", "dev.db"));

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    custom_domain TEXT UNIQUE,
    plan TEXT NOT NULL DEFAULT 'trial',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (tenant_id, email)
  );
`);
