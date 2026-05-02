import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { requireApiKey, filterByScope, type AuthedRequest } from "../middleware/apiKey.js";
import {
  getAllEmployees,
  getEmployeeByUuid,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDocumentsByEmployeeId,
  getExpiringDocuments,
} from "../db.js";

export const employeesRouter = Router();

const CreateSchema = z.object({
  fullName:             z.string().min(1),
  employeeCode:         z.string().optional(),
  companyEmail:         z.string().email().optional(),
  department:           z.string().optional(),
  jobTitle:             z.string().optional(),
  status:               z.enum(["active", "inactive", "on_leave", "terminated"]).optional(),
  preferredName:        z.string().optional(),
  birthDate:            z.string().optional(),
  nationality:          z.string().optional(),
  nationalId:           z.string().optional(),
  personalPhone:        z.string().optional(),
  managerId:            z.number().int().optional(),
  costCenter:           z.string().optional(),
  hireDate:             z.string().optional(),
  contractType:         z.enum(["permanent", "contract", "secondment"]).optional(),
  location:             z.string().optional(),
  iqamaNumber:          z.string().optional(),
  iqamaExpiry:          z.string().optional(),
  passportExpiry:       z.string().optional(),
  visaExpiry:           z.string().optional(),
  drivingLicenseExpiry: z.string().optional(),
  authorizedApps:       z.array(z.string()).optional(),
  timezone:             z.string().optional(),
});

// GET /v1/employees
employeesRouter.get("/", requireApiKey("read:profile"), async (req: AuthedRequest, res) => {
  const { search, department, status } = req.query as Record<string, string>;
  const rows = await getAllEmployees({ search, department, status });
  const scope = req.apiKey!.scope;
  res.json(rows.map(r => filterByScope(r as Record<string, unknown>, scope)));
});

// GET /v1/employees/:uuid
employeesRouter.get("/:uuid", requireApiKey("read:profile"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const scope = req.apiKey!.scope;
  res.json(filterByScope(emp as Record<string, unknown>, scope));
});

// GET /v1/employees/:uuid/documents
employeesRouter.get("/:uuid/documents", requireApiKey("read:internal"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const docs = await getDocumentsByEmployeeId(emp.id);
  res.json(docs);
});

// POST /v1/employees
employeesRouter.post("/", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const emp = await createEmployee({ ...parsed.data, uuid: uuidv4() });
  res.status(201).json(emp);
});

// PATCH /v1/employees/:uuid
employeesRouter.patch("/:uuid", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = CreateSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  await updateEmployee(req.params.uuid, parsed.data);
  const updated = await getEmployeeByUuid(req.params.uuid);
  res.json(updated);
});

// DELETE /v1/employees/:uuid
employeesRouter.delete("/:uuid", requireApiKey("full"), async (req: AuthedRequest, res) => {
  const deleted = await deleteEmployee(req.params.uuid);
  if (!deleted) { res.status(404).json({ error: "Employee not found" }); return; }
  res.json({ success: true });
});

// GET /v1/employees/meta/expiring?days=60
employeesRouter.get("/meta/expiring", requireApiKey("read:internal"), async (req: AuthedRequest, res) => {
  const days = parseInt(req.query.days as string ?? "60", 10);
  const docs = await getExpiringDocuments(isNaN(days) ? 60 : days);
  res.json(docs);
});
