import "dotenv/config";
import cors from "cors";
import express from "express";
import { initSchema } from "./db";
import { authRouter } from "./routes/auth";
import { customersRouter } from "./routes/customers";
import { leadsRouter } from "./routes/leads";
import { meRouter } from "./routes/me";

const app = express();

// ALLOWED_ORIGIN, e.g. "https://optimaflexpay.com" — set in Render's
// environment settings. Falls back to allowing localhost for dev.
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/customers", customersRouter);
app.use("/api/leads", leadsRouter);

const PORT = process.env.PORT || 4000;

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Adepa CRM backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database schema:", err);
    process.exit(1);
  });
