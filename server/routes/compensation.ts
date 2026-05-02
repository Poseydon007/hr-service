import { Router } from "express";
import { z } from "zod";
import { requireApiKey, type AuthedRequest } from "../middleware/apiKey.js";
import {
  getEmployeeByUuid,
  getCompensationByEmployeeId,
  createCompensation,
  updateCompensation,
  deleteCompensation,
} from "../db.js";

export const compensationRouter = Router({ mergeParams: true });

const CompSchema = z.object({
  effectiveDate:      z.string(),
  currency:           z.string().default("SAR"),
  basicSalary:        z.string().optional(),
  housingAllowance:   z.string().optional(),
  transportAllowance: z.string().optional(),
  otherAllowances:    z.string().optional(),
  bankName:           z.string().optional(),
  bankIban:           z.string().optional(),
  paymentMethod:      z.enum(["bank_transfer", "cash", "cheque"]).optional(),
  notes:              z.string().optional(),
});

// GET /v1/employees/:uuid/compensation
compensationRouter.get("/", requireApiKey("read:sensitive"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const rows = await getCompensationByEmployeeId(emp.id);
  res.json(rows);
});

// POST /v1/employees/:uuid/compensation
compensationRouter.post("/", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = CompSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await createCompensation({ employeeId: emp.id, ...parsed.data });
  res.status(201).json(row);
});

// PATCH /v1/employees/:uuid/compensation/:id
compensationRouter.patch("/:id", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = CompSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await updateCompensation(parseInt(req.params.id), parsed.data);
  if (!row) { res.status(404).json({ error: "Record not found" }); return; }
  res.json(row);
});

// DELETE /v1/employees/:uuid/compensation/:id
compensationRouter.delete("/:id", requireApiKey("full"), async (req: AuthedRequest, res) => {
  const deleted = await deleteCompensation(parseInt(req.params.id));
  if (!deleted) { res.status(404).json({ error: "Record not found" }); return; }
  res.json({ success: true });
});
