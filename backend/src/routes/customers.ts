import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth } from "../middleware/requireAuth";

export const customersRouter = Router();
customersRouter.use(requireAuth);

customersRouter.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, email, phone, company, created_at FROM customers WHERE tenant_id = $1 ORDER BY created_at DESC",
    [req.tenantId]
  );
  res.json({ customers: result.rows });
});

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
});

customersRouter.post("/", async (req, res) => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, phone, company } = parsed.data;
  const id = randomUUID();

  await pool.query(
    "INSERT INTO customers (id, tenant_id, name, email, phone, company) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, req.tenantId, name, email || null, phone || null, company || null]
  );

  res.status(201).json({
    customer: { id, name, email: email || null, phone: phone || null, company: company || null },
  });
});
