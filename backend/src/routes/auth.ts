import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { hashPassword, signToken, verifyPassword } from "../auth";

export const authRouter = Router();

const subdomainPattern = /^[a-z0-9-]{3,32}$/;

const signupSchema = z.object({
  businessName: z.string().min(2),
  subdomain: z.string().regex(subdomainPattern, "Lowercase letters, numbers, hyphens only"),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { businessName, subdomain, name, email, password } = parsed.data;

  const existing = db.prepare("SELECT id FROM tenants WHERE subdomain = ?").get(subdomain);
  if (existing) {
    return res.status(409).json({ error: "That subdomain is taken. Try another." });
  }

  const passwordHash = await hashPassword(password);
  const tenantId = randomUUID();
  const userId = randomUUID();

  const insertTenant = db.prepare(
    "INSERT INTO tenants (id, name, subdomain) VALUES (?, ?, ?)"
  );
  const insertUser = db.prepare(
    "INSERT INTO users (id, tenant_id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?, 'owner')"
  );
  db.transaction(() => {
    insertTenant.run(tenantId, businessName, subdomain);
    insertUser.run(userId, tenantId, email, passwordHash, name);
  })();

  const token = signToken({ userId, tenantId });

  res.status(201).json({
    token,
    tenant: { id: tenantId, name: businessName, subdomain },
    user: { id: userId, name, email, role: "owner" },
  });
});

const loginSchema = z.object({
  subdomain: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { subdomain, email, password } = parsed.data;

  const tenant = db
    .prepare("SELECT id, name, subdomain FROM tenants WHERE subdomain = ?")
    .get(subdomain) as { id: string; name: string; subdomain: string } | undefined;
  if (!tenant) {
    return res.status(401).json({ error: "That workspace doesn't exist." });
  }

  const user = db
    .prepare(
      "SELECT id, name, email, password_hash, role FROM users WHERE tenant_id = ? AND email = ?"
    )
    .get(tenant.id, email) as
    | { id: string; name: string; email: string; password_hash: string; role: string }
    | undefined;
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = signToken({ userId: user.id, tenantId: tenant.id });

  res.json({
    token,
    tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});
