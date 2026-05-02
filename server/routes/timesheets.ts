import { Router } from "express";
import { z } from "zod";
import { requireApiKey, type AuthedRequest } from "../middleware/apiKey.js";
import {
  getEmployeeByUuid,
  getTimesheetsByEmployeeId,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
} from "../db.js";

export const timesheetsRouter = Router({ mergeParams: true });

const TSSchema = z.object({
  workDate:       z.string(),
  hoursRegular:   z.string().default("8.00"),
  hoursOvertime:  z.string().default("0.00"),
  siteLocation:   z.string().optional(),
  projectCode:    z.string().optional(),
  status:         z.enum(["draft", "submitted", "approved", "rejected"]).default("draft"),
  approvedByUuid: z.string().optional(),
  notes:          z.string().optional(),
});

// GET /v1/employees/:uuid/timesheets
timesheetsRouter.get("/", requireApiKey("read:internal"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const { status } = req.query as Record<string, string>;
  const rows = await getTimesheetsByEmployeeId(emp.id, { status });
  res.json(rows);
});

// POST /v1/employees/:uuid/timesheets
timesheetsRouter.post("/", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = TSSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await createTimesheet({ employeeId: emp.id, ...parsed.data });
  res.status(201).json(row);
});

// PATCH /v1/employees/:uuid/timesheets/:id
timesheetsRouter.patch("/:id", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = TSSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await updateTimesheet(parseInt(req.params.id), parsed.data);
  if (!row) { res.status(404).json({ error: "Record not found" }); return; }
  res.json(row);
});

// DELETE /v1/employees/:uuid/timesheets/:id
timesheetsRouter.delete("/:id", requireApiKey("full"), async (req: AuthedRequest, res) => {
  const deleted = await deleteTimesheet(parseInt(req.params.id));
  if (!deleted) { res.status(404).json({ error: "Record not found" }); return; }
  res.json({ success: true });
});
