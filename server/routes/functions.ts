import { Router } from "express";
import { z } from "zod";
import { requireApiKey, type AuthedRequest } from "../middleware/apiKey.js";
import {
  getEmployeeByUuid,
  getFunctionsByEmployeeId,
  createFunction,
  updateFunction,
  deleteFunction,
} from "../db.js";

export const functionsRouter = Router({ mergeParams: true });

const FnSchema = z.object({
  functionTitle:   z.string().min(1),
  functionCode:    z.string().optional(),
  description:     z.string().optional(),
  competencyLevel: z.number().int().min(1).max(5).optional(),
  certifiedDate:   z.string().optional(),
  expiryDate:      z.string().optional(),
});

// GET /v1/employees/:uuid/functions
functionsRouter.get("/", requireApiKey("read:internal"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const rows = await getFunctionsByEmployeeId(emp.id);
  res.json(rows);
});

// POST /v1/employees/:uuid/functions
functionsRouter.post("/", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = FnSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await createFunction({ employeeId: emp.id, ...parsed.data });
  res.status(201).json(row);
});

// PATCH /v1/employees/:uuid/functions/:id
functionsRouter.patch("/:id", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = FnSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await updateFunction(parseInt(req.params.id), parsed.data);
  if (!row) { res.status(404).json({ error: "Record not found" }); return; }
  res.json(row);
});

// DELETE /v1/employees/:uuid/functions/:id
functionsRouter.delete("/:id", requireApiKey("full"), async (req: AuthedRequest, res) => {
  const deleted = await deleteFunction(parseInt(req.params.id));
  if (!deleted) { res.status(404).json({ error: "Record not found" }); return; }
  res.json({ success: true });
});
