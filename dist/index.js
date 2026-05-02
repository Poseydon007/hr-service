// server/index.ts
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

// server/routes/employees.ts
import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// server/middleware/apiKey.ts
import { createHash } from "crypto";

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, lte } from "drizzle-orm";

// drizzle/schema.ts
import { mysqlTable, int, varchar, text, date, timestamp, mysqlEnum, json, boolean } from "drizzle-orm/mysql-core";
var employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).unique().notNull(),
  employeeCode: varchar("employee_code", { length: 32 }).unique(),
  companyEmail: varchar("company_email", { length: 255 }).unique(),
  status: mysqlEnum("status", ["active", "inactive", "on_leave", "terminated"]).default("active").notNull(),
  // Personal
  fullName: varchar("full_name", { length: 255 }).notNull(),
  preferredName: varchar("preferred_name", { length: 255 }),
  birthDate: date("birth_date"),
  nationality: varchar("nationality", { length: 100 }),
  nationalId: varchar("national_id", { length: 100 }),
  // iqama / Saudi ID
  profilePictureUrl: text("profile_picture_url"),
  personalPhone: varchar("personal_phone", { length: 50 }),
  // Work Context
  department: varchar("department", { length: 100 }),
  jobTitle: varchar("job_title", { length: 150 }),
  managerId: int("manager_id"),
  // self-ref FK, handled in app layer
  costCenter: varchar("cost_center", { length: 100 }),
  hireDate: date("hire_date"),
  contractType: mysqlEnum("contract_type", ["permanent", "contract", "secondment"]),
  location: varchar("location", { length: 150 }).default("Dammam, KSA"),
  // KSA Compliance — expiry tracking
  iqamaNumber: varchar("iqama_number", { length: 50 }),
  iqamaExpiry: date("iqama_expiry"),
  passportExpiry: date("passport_expiry"),
  visaExpiry: date("visa_expiry"),
  drivingLicenseExpiry: date("driving_license_expiry"),
  // App Metadata
  authorizedApps: json("authorized_apps").$type().default([]),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Riyadh"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var employeeDocuments = mysqlTable("employee_documents", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull(),
  docType: varchar("doc_type", { length: 100 }).notNull(),
  // iqama, passport, contract, visa, other
  fileUrl: text("file_url"),
  issuedDate: date("issued_date"),
  expiryDate: date("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(),
  // first 8 chars, for display
  appName: varchar("app_name", { length: 100 }).notNull(),
  scope: json("scope").$type().notNull().default([]),
  active: boolean("active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/db.ts
var _db = null;
function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    _db = drizzle(url);
  }
  return _db;
}
async function getAllEmployees(opts) {
  const db = getDb();
  let rows = await db.select().from(employees);
  if (opts?.status) {
    rows = rows.filter((r) => r.status === opts.status);
  }
  if (opts?.department) {
    rows = rows.filter((r) => r.department?.toLowerCase() === opts.department.toLowerCase());
  }
  if (opts?.search) {
    const s = opts.search.toLowerCase();
    rows = rows.filter(
      (r) => r.fullName.toLowerCase().includes(s) || r.department?.toLowerCase().includes(s) || r.jobTitle?.toLowerCase().includes(s) || r.employeeCode?.toLowerCase().includes(s)
    );
  }
  return rows;
}
async function getEmployeeByUuid(uuid) {
  const db = getDb();
  const result = await db.select().from(employees).where(eq(employees.uuid, uuid)).limit(1);
  return result[0] ?? null;
}
async function createEmployee(data) {
  const db = getDb();
  await db.insert(employees).values(data);
  const result = await db.select().from(employees).where(eq(employees.uuid, data.uuid)).limit(1);
  return result[0];
}
async function updateEmployee(uuid, data) {
  const db = getDb();
  await db.update(employees).set(data).where(eq(employees.uuid, uuid));
}
async function deleteEmployee(uuid) {
  const db = getDb();
  const emp = await getEmployeeByUuid(uuid);
  if (!emp) return false;
  await db.delete(employeeDocuments).where(eq(employeeDocuments.employeeId, emp.id));
  await db.delete(employees).where(eq(employees.uuid, uuid));
  return true;
}
async function getDocumentsByEmployeeId(employeeId) {
  const db = getDb();
  return db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId));
}
async function getApiKeyByHash(hash) {
  const db = getDb();
  const result = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, hash), eq(apiKeys.active, true))).limit(1);
  return result[0] ?? null;
}
async function touchApiKey(id) {
  const db = getDb();
  await db.update(apiKeys).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(eq(apiKeys.id, id));
}
async function getExpiringDocuments(withinDays = 60) {
  const db = getDb();
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return db.select().from(employeeDocuments).where(lte(employeeDocuments.expiryDate, cutoffStr));
}

// server/middleware/apiKey.ts
function hashKey(raw) {
  return createHash("sha256").update(raw).digest("hex");
}
function requireApiKey(requiredScope) {
  return async (req, res, next) => {
    const header = req.headers.authorization ?? "";
    const raw = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!raw) {
      res.status(401).json({ error: "Missing API key" });
      return;
    }
    const hash = hashKey(raw);
    const key = await getApiKeyByHash(hash);
    if (!key) {
      res.status(401).json({ error: "Invalid or inactive API key" });
      return;
    }
    if (requiredScope && !key.scope.includes(requiredScope) && !key.scope.includes("full")) {
      res.status(403).json({ error: `Scope '${requiredScope}' required` });
      return;
    }
    req.apiKey = { id: key.id, appName: key.appName, scope: key.scope };
    touchApiKey(key.id).catch(() => {
    });
    next();
  };
}
function filterByScope(employee, scope) {
  const isInternal = scope.includes("read:internal") || scope.includes("full");
  const isSensitive = scope.includes("read:sensitive") || scope.includes("full");
  const pub = {
    uuid: employee.uuid,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    preferredName: employee.preferredName,
    department: employee.department,
    jobTitle: employee.jobTitle,
    profilePictureUrl: employee.profilePictureUrl,
    status: employee.status,
    location: employee.location,
    timezone: employee.timezone,
    authorizedApps: employee.authorizedApps
  };
  if (!isInternal) return pub;
  const internal = {
    ...pub,
    companyEmail: employee.companyEmail,
    hireDate: employee.hireDate,
    contractType: employee.contractType,
    costCenter: employee.costCenter,
    managerId: employee.managerId,
    personalPhone: employee.personalPhone
  };
  if (!isSensitive) return internal;
  return {
    ...internal,
    birthDate: employee.birthDate,
    nationalId: employee.nationalId,
    iqamaNumber: employee.iqamaNumber,
    iqamaExpiry: employee.iqamaExpiry,
    passportExpiry: employee.passportExpiry,
    visaExpiry: employee.visaExpiry,
    drivingLicenseExpiry: employee.drivingLicenseExpiry,
    nationality: employee.nationality
  };
}

// server/routes/employees.ts
var employeesRouter = Router();
var CreateSchema = z.object({
  fullName: z.string().min(1),
  employeeCode: z.string().optional(),
  companyEmail: z.string().email().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave", "terminated"]).optional(),
  preferredName: z.string().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  nationalId: z.string().optional(),
  personalPhone: z.string().optional(),
  managerId: z.number().int().optional(),
  costCenter: z.string().optional(),
  hireDate: z.string().optional(),
  contractType: z.enum(["permanent", "contract", "secondment"]).optional(),
  location: z.string().optional(),
  iqamaNumber: z.string().optional(),
  iqamaExpiry: z.string().optional(),
  passportExpiry: z.string().optional(),
  visaExpiry: z.string().optional(),
  drivingLicenseExpiry: z.string().optional(),
  authorizedApps: z.array(z.string()).optional(),
  timezone: z.string().optional()
});
employeesRouter.get("/", requireApiKey("read:profile"), async (req, res) => {
  const { search, department, status } = req.query;
  const rows = await getAllEmployees({ search, department, status });
  const scope = req.apiKey.scope;
  res.json(rows.map((r) => filterByScope(r, scope)));
});
employeesRouter.get("/:uuid", requireApiKey("read:profile"), async (req, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  const scope = req.apiKey.scope;
  res.json(filterByScope(emp, scope));
});
employeesRouter.get("/:uuid/documents", requireApiKey("read:internal"), async (req, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  const docs = await getDocumentsByEmployeeId(emp.id);
  res.json(docs);
});
employeesRouter.post("/", requireApiKey("write"), async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const emp = await createEmployee({ ...parsed.data, uuid: uuidv4() });
  res.status(201).json(emp);
});
employeesRouter.patch("/:uuid", requireApiKey("write"), async (req, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  const parsed = CreateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  await updateEmployee(req.params.uuid, parsed.data);
  const updated = await getEmployeeByUuid(req.params.uuid);
  res.json(updated);
});
employeesRouter.delete("/:uuid", requireApiKey("full"), async (req, res) => {
  const deleted = await deleteEmployee(req.params.uuid);
  if (!deleted) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json({ success: true });
});
employeesRouter.get("/meta/expiring", requireApiKey("read:internal"), async (req, res) => {
  const days = parseInt(req.query.days ?? "60", 10);
  const docs = await getExpiringDocuments(isNaN(days) ? 60 : days);
  res.json(docs);
});

// server/routes/admin.ts
import { Router as Router2 } from "express";
import { createHash as createHash2, randomBytes } from "crypto";
import { z as z2 } from "zod";
import { eq as eq2 } from "drizzle-orm";
var adminRouter = Router2();
adminRouter.use(requireApiKey("full"));
adminRouter.get("/keys", async (_req, res) => {
  const db = getDb();
  const keys = await db.select({
    id: apiKeys.id,
    keyPrefix: apiKeys.keyPrefix,
    appName: apiKeys.appName,
    scope: apiKeys.scope,
    active: apiKeys.active,
    lastUsedAt: apiKeys.lastUsedAt,
    createdAt: apiKeys.createdAt
  }).from(apiKeys);
  res.json(keys);
});
adminRouter.post("/keys", async (req, res) => {
  const parsed = z2.object({
    appName: z2.string().min(1),
    scope: z2.array(z2.string()).min(1)
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const raw = randomBytes(24).toString("hex");
  const hash = createHash2("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 8);
  const db = getDb();
  await db.insert(apiKeys).values({
    keyHash: hash,
    keyPrefix: prefix,
    appName: parsed.data.appName,
    scope: parsed.data.scope,
    active: true
  });
  res.status(201).json({
    key: raw,
    prefix,
    appName: parsed.data.appName,
    scope: parsed.data.scope,
    note: "Store this key securely \u2014 it will not be shown again."
  });
});
adminRouter.delete("/keys/:id", async (req, res) => {
  const db = getDb();
  await db.update(apiKeys).set({ active: false }).where(eq2(apiKeys.id, parseInt(req.params.id, 10)));
  res.json({ success: true });
});

// server/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var app = express();
var PORT = parseInt(process.env.PORT ?? "3000", 10);
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") ?? "*",
  credentials: true
}));
app.use(express.json());
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "hr-service", ts: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/v1/employees", employeesRouter);
app.use("/v1/admin", adminRouter);
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
      "DELETE /v1/admin/keys/:id"
    ],
    scopes: ["read:profile", "read:internal", "read:sensitive", "write", "full"]
  });
});
var publicDir = join(__dirname, "public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
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
