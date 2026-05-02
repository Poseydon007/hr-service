import express from "express";
import cors from "cors";
import { employeesRouter } from "./routes/employees.js";
import { adminRouter } from "./routes/admin.js";

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

app.listen(PORT, () => {
  console.log(`[HR Service] Running on port ${PORT}`);
});
