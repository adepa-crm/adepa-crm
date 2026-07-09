import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../auth";

// Every authenticated request carries tenantId, derived only from the
// verified JWT — never from a request body or query param. This is the
// single choke point that keeps one tenant's data from leaking into
// another's queries. Route handlers must always filter by req.tenantId.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tenantId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.userId;
    req.tenantId = payload.tenantId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
