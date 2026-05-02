import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { employeesRouter } from "./routes/employees.js";
import { adminRouter } from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") ?? "*",
  credentials: true,
}));
app.use(express.json());

// ── Health ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "hr-service", ts: new Date().toISOString() });
});

// ── API v1 ──────────────────────────────────────────────────
app.use("/v1/employees", employeesRouter);
app.use("/v1/admin",     adminRouter);

// ── OpenAPI stub ────────────────────────────────────────────
app.get("/v1", (_req, res) => {
  res.json({
    service: "True East HR Service",
    version: "1.0.0",
    endpoints: [
      "GET  /v1/employees",
      "GET  /v1/employees/:uuid",
      "GET  /v1/employees/:uuid/documents",
      "POST /v1/employees",
      "PATCH /v1/employees/:uuid",
      "DELETE /v1/employees/:uuid",
      "GET  /v1/employees/meta/expiring?days=60",
      "GET  /v1/admin/keys",
      "POST /v1/admin/keys",
      "DELETE /v1/admin/keys/:id",
    ],
    scopes: ["read:profile", "read:internal", "read:sensitive", "write", "full"],
  });
});

// ── Static SPA ──────────────────────────────────────────────
const publicDir = join(__dirname, "public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback — only for non-API, non-health routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/v1") || req.path.startsWith("/health")) {
      return next();
    }
    res.sendFile(join(publicDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[HR Service] Running on port ${PORT}`);
});
