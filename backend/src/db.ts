import { Pool } from "pg";

// DATABASE_URL is a standard Postgres connection string, e.g. from Supabase:
//   postgresql://postgres:[password]@[host]:5432/postgres
// Supabase's connection requires SSL; rejectUnauthorized: false avoids
// local cert-chain issues without disabling encryption itself.
const useSsl = process.env.DATABASE_SSL !== "false";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      subdomain TEXT NOT NULL UNIQUE,
      custom_domain TEXT UNIQUE,
      plan TEXT NOT NULL DEFAULT 'trial',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      tenant_id UUID NOT NULL REFERENCES tenants(id),
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, email)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY,
      tenant_id UUID NOT NULL REFERENCES tenants(id),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY,
      tenant_id UUID NOT NULL REFERENCES tenants(id),
      customer_id UUID REFERENCES customers(id),
      title TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'new',
      value NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
  `);
}
