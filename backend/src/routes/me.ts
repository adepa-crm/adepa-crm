import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/requireAuth";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res) => {
  const row = db
    .prepare(
      `SELECT u.id as user_id, u.name as user_name, u.email, u.role,
              t.id as tenant_id, t.name as tenant_name, t.subdomain, t.plan
       FROM users u JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = ? AND u.tenant_id = ?`
    )
    .get(req.userId, req.tenantId) as
    | {
        user_id: string;
        user_name: string;
        email: string;
        role: string;
        tenant_id: string;
        tenant_name: string;
        subdomain: string;
        plan: string;
      }
    | undefined;

  if (!row) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    user: { id: row.user_id, name: row.user_name, email: row.email, role: row.role },
    tenant: { id: row.tenant_id, name: row.tenant_name, subdomain: row.subdomain, plan: row.plan },
  });
});
