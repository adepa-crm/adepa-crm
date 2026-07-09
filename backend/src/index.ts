import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Adepa CRM backend running on http://localhost:${PORT}`);
});
