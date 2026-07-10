import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth } from "../middleware/requireAuth";

export const leadsRouter = Router();
leadsRouter.use(requireAuth);

const STAGES = ["new", "qualified", "proposal", "won", "lost"] as const;

leadsRouter.get("/", async (req, res) => {
  const result = await pool.query(
    `SELECT l.id, l.title, l.stage, l.value, l.created_at,
            c.id as customer_id, c.name as customer_name
     FROM leads l
     LEFT JOIN customers c ON c.id = l.customer_id
     WHERE l.tenant_id = $1
     ORDER BY l.created_at DESC`,
    [req.tenantId]
  );
  const leads = result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    stage: row.stage,
    value: Number(row.value),
    createdAt: row.created_at,
    customer: row.customer_id ? { id: row.customer_id, name: row.customer_name } : null,
  }));
  res.json({ leads });
});

const createLeadSchema = z.object({
  title: z.string().min(1),
  customerId: z.string().uuid().optional().or(z.literal("")),
  value: z.number().nonnegative().optional(),
});

leadsRouter.post("/", async (req, res) => {
  const parsed = createLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { title, customerId, value } = parsed.data;
  const id = randomUUID();

  await pool.query(
    "INSERT INTO leads (id, tenant_id, customer_id, title, value) VALUES ($1, $2, $3, $4, $5)",
    [id, req.tenantId, customerId || null, title, value ?? 0]
  );

  res.status(201).json({ lead: { id, title, stage: "new", value: value ?? 0 } });
});

const updateStageSchema = z.object({
  stage: z.enum(STAGES),
});

leadsRouter.patch("/:id/stage", async (req, res) => {
  const parsed = updateStageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const result = await pool.query(
    "UPDATE leads SET stage = $1, updated_at = now() WHERE id = $2 AND tenant_id = $3 RETURNING id, stage",
    [parsed.data.stage, req.params.id, req.tenantId]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Lead not found" });
  }
  res.json({ lead: result.rows[0] });
});
