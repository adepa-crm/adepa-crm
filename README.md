# Adepa CRM — skeleton

A running starting point for the Ghana-focused CRM: multi-tenant signup and
login, a JWT-protected session, and a dashboard shell with placeholders for
the modules we've been designing (sales, accounting, payroll, HR).

## What's actually here

- **`backend/`** — Express + TypeScript API.
  - `POST /api/auth/signup` — creates a tenant (a business) and its first
    owner user in one transaction.
  - `POST /api/auth/login` — takes `subdomain + email + password`, returns
    a JWT scoped to that tenant.
  - `GET /api/me` — protected route, returns the current user and tenant.
  - `requireAuth` middleware derives `tenantId` only from the verified JWT
    and attaches it to every request — this is the choke point every future
    route must filter by, so one business's data can never leak into
    another's queries.
- **`frontend/`** — React + Vite. Signup and login forms, a persisted auth
  session (`localStorage` + context), and a dashboard shell with a sidebar
  listing the modules from our earlier planning — Sales, Accounting,
  Payroll, HR are visible but marked "Soon" until they're built out.

## Running it locally

```bash
# backend
cd backend
npm install
echo 'DATABASE_URL="file:./dev.db"' > .env
npm run dev          # http://localhost:4000

# frontend, in a second terminal
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Sign up with any business name — it becomes your workspace subdomain — and
you'll land on the dashboard shell.

## About the database layer

`backend/src/db.ts` uses `better-sqlite3` with plain SQL rather than an ORM.
That's a workaround for this sandbox specifically, which blocks the network
call Prisma's CLI needs to download its query engine binary — it isn't a
recommendation for production.

`backend/prisma/schema.prisma` is kept in the repo as the reference schema
— it documents the same two tables (`Tenant`, `User`) in Prisma's syntax.
When you're developing on your own machine with normal internet access,
either:

1. Reintroduce Prisma (`npm install prisma @prisma/client`, then rewrite
   `db.ts`'s queries as Prisma client calls) and point the datasource at
   Postgres, or
2. Keep raw SQL but swap `better-sqlite3` for `pg` and adjust connection
   handling — the query shapes barely change.

Either way, Postgres is the right production database for this, per the
earlier architecture discussion: strong relational integrity for the
payroll/tax audit trail, and easy support for the rate-versioning tables
that a real SSNIT/PAYE engine needs.

## Where this goes next

This skeleton deliberately stops at "auth works, dashboard renders." The
next real build blocks, in the order we scoped them:

1. **CRM core** — contacts, leads, pipeline stages on top of the same
   tenant-scoped pattern `auth` already establishes.
2. **Invoicing** — the `INVOICE` / `INVOICE_LINE` tables from the schema
   discussion, VAT/NHIL/GETFund/COVID-levy calculation, and the GRA e-VAT
   certification flow (draft → submit → certified ID/QR → issued).
3. **Payroll** — `EMPLOYEE`, `PAYROLL_RUN`, `PAYSLIP` tables, SSNIT Tier 1/2
   and PAYE band calculations, with rate-versioning so historical payslips
   keep the rates that applied when they were run.
4. **Payment gateways** — MTN MoMo first (largest share), Hubtel as an
   aggregator layer, Vodafone Cash and AirtelTigo Money after.
5. **Custom domains** — CNAME + auto-SSL provisioning per tenant, once
   there's enough here for a business to actually want to point their
   domain at it.
