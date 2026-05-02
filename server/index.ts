import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { employeesRouter }   from "./routes/employees.js";
import { adminRouter }        from "./routes/admin.js";
import { compensationRouter } from "./routes/compensation.js";
import { timesheetsRouter }   from "./routes/timesheets.js";
import { leaveRouter }        from "./routes/leave.js";
import { functionsRouter }    from "./routes/functions.js";
import { trainingRouter }     from "./routes/training.js";

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
app.use("/v1/employees",                        employeesRouter);
app.use("/v1/employees/:uuid/compensation",     compensationRouter);
app.use("/v1/employees/:uuid/timesheets",       timesheetsRouter);
app.use("/v1/employees/:uuid/leave",            leaveRouter);
app.use("/v1/employees/:uuid/functions",        functionsRouter);
app.use("/v1/employees/:uuid/training",         trainingRouter);
app.use("/v1/admin",                            adminRouter);

// ── OpenAPI stub ────────────────────────────────────────────
app.get("/v1", (_req, res) => {
  res.json({
    service: "True East HR Service",
    version: "2.0.0",
    endpoints: [
      // Employees
      "GET    /v1/employees",
      "POST   /v1/employees",
      "GET    /v1/employees/:uuid",
      "PATCH  /v1/employees/:uuid",
      "DELETE /v1/employees/:uuid",
      "GET    /v1/employees/:uuid/documents",
      "GET    /v1/employees/meta/expiring?days=60",
      // Compensation  (scope: read:sensitive / write / full)
      "GET    /v1/employees/:uuid/compensation",
      "POST   /v1/employees/:uuid/compensation",
      "PATCH  /v1/employees/:uuid/compensation/:id",
      "DELETE /v1/employees/:uuid/compensation/:id",
      // Timesheets  (scope: read:internal / write / full)
      "GET    /v1/employees/:uuid/timesheets",
      "POST   /v1/employees/:uuid/timesheets",
      "PATCH  /v1/employees/:uuid/timesheets/:id",
      "DELETE /v1/employees/:uuid/timesheets/:id",
      // Leave  (scope: read:internal / write / full)
      "GET    /v1/employees/:uuid/leave",
      "POST   /v1/employees/:uuid/leave",
      "PATCH  /v1/employees/:uuid/leave/:id",
      "DELETE /v1/employees/:uuid/leave/:id",
      // Functions & Competencies  (scope: read:internal / write / full)
      "GET    /v1/employees/:uuid/functions",
      "POST   /v1/employees/:uuid/functions",
      "PATCH  /v1/employees/:uuid/functions/:id",
      "DELETE /v1/employees/:uuid/functions/:id",
      // Training & Certifications  (scope: read:internal / write / full)
      "GET    /v1/employees/:uuid/training",
      "POST   /v1/employees/:uuid/training",
      "PATCH  /v1/employees/:uuid/training/:id",
      "DELETE /v1/employees/:uuid/training/:id",
      // Admin
      "GET    /v1/admin/keys",
      "POST   /v1/admin/keys",
      "DELETE /v1/admin/keys/:id",
    ],
    scopes: ["read:profile", "read:internal", "read:sensitive", "write", "full"],
  });
});

// ── Static SPA ──────────────────────────────────────────────
const publicDir = join(__dirname, "public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback — Express 5 uses '/{*splat}' not '*'
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/v1") || req.path.startsWith("/health")) {
      return next();
    }
    res.sendFile(join(publicDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[HR Service] Running on port ${PORT}`);
});
