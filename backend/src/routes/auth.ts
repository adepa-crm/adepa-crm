import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { generateResetToken, hashPassword, hashResetToken, signToken, verifyPassword } from "../auth";
import { sendPasswordResetEmail } from "../email";

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

  const existing = await pool.query("SELECT id FROM tenants WHERE subdomain = $1", [subdomain]);
  if (existing.rowCount && existing.rowCount > 0) {
    return res.status(409).json({ error: "That subdomain is taken. Try another." });
  }

  const passwordHash = await hashPassword(password);
  const tenantId = randomUUID();
  const userId = randomUUID();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO tenants (id, name, subdomain) VALUES ($1, $2, $3)",
      [tenantId, businessName, subdomain]
    );
    await client.query(
      "INSERT INTO users (id, tenant_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5, 'owner')",
      [userId, tenantId, email, passwordHash, name]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

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

  const tenantResult = await pool.query(
    "SELECT id, name, subdomain FROM tenants WHERE subdomain = $1",
    [subdomain]
  );
  const tenant = tenantResult.rows[0] as { id: string; name: string; subdomain: string } | undefined;
  if (!tenant) {
    return res.status(401).json({ error: "That workspace doesn't exist." });
  }

  const userResult = await pool.query(
    "SELECT id, name, email, password_hash, role FROM users WHERE tenant_id = $1 AND email = $2",
    [tenant.id, email]
  );
  const user = userResult.rows[0] as
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

const forgotPasswordSchema = z.object({
  subdomain: z.string().min(1),
  email: z.string().email(),
});

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { subdomain, email } = parsed.data;

  // Always respond the same way whether or not the account exists —
  // otherwise this endpoint becomes a way to check which emails have
  // signed up, which is a real (if minor) privacy leak.
  const genericResponse = {
    message: "If an account exists for that email, a reset link has been sent.",
  };

  const tenantResult = await pool.query("SELECT id FROM tenants WHERE subdomain = $1", [subdomain]);
  const tenant = tenantResult.rows[0] as { id: string } | undefined;
  if (!tenant) {
    return res.json(genericResponse);
  }

  const userResult = await pool.query(
    "SELECT id FROM users WHERE tenant_id = $1 AND email = $2",
    [tenant.id, email]
  );
  const user = userResult.rows[0] as { id: string } | undefined;
  if (!user) {
    return res.json(genericResponse);
  }

  const { token, hash } = generateResetToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    "UPDATE users SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3",
    [hash, expires, user.id]
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    // Still return the generic success response — don't leak whether
    // the email step itself failed, and don't block the flow on it.
  }

  res.json(genericResponse);
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  const userResult = await pool.query(
    "SELECT id, tenant_id FROM users WHERE reset_token_hash = $1 AND reset_token_expires > now()",
    [tokenHash]
  );
  const user = userResult.rows[0] as { id: string; tenant_id: string } | undefined;
  if (!user) {
    return res.status(400).json({ error: "That reset link is invalid or has expired." });
  }

  const passwordHash = await hashPassword(password);
  await pool.query(
    "UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2",
    [passwordHash, user.id]
  );

  res.json({ message: "Password updated. You can now log in." });
});
