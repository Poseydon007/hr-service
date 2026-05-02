import { Router } from "express";
import { z } from "zod";
import { requireApiKey, type AuthedRequest } from "../middleware/apiKey.js";
import {
  getEmployeeByUuid,
  getLeaveByEmployeeId,
  createLeave,
  updateLeave,
  deleteLeave,
} from "../db.js";

export const leaveRouter = Router({ mergeParams: true });

const LeaveSchema = z.object({
  leaveType:      z.enum(["annual", "sick", "emergency", "unpaid", "maternity", "hajj", "other"]),
  startDate:      z.string(),
  endDate:        z.string(),
  days:           z.number().int().positive(),
  status:         z.enum(["pending", "approved", "rejected", "cancelled"]).default("pending"),
  approvedByUuid: z.string().optional(),
  reason:         z.string().optional(),
  notes:          z.string().optional(),
});

// GET /v1/employees/:uuid/leave
leaveRouter.get("/", requireApiKey("read:internal"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const { status, leaveType } = req.query as Record<string, string>;
  const rows = await getLeaveByEmployeeId(emp.id, { status, leaveType });
  res.json(rows);
});

// POST /v1/employees/:uuid/leave
leaveRouter.post("/", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = LeaveSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await createLeave({ employeeId: emp.id, ...parsed.data });
  res.status(201).json(row);
});

// PATCH /v1/employees/:uuid/leave/:id
leaveRouter.patch("/:id", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = LeaveSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await updateLeave(parseInt(req.params.id), parsed.data);
  if (!row) { res.status(404).json({ error: "Record not found" }); return; }
  res.json(row);
});

// DELETE /v1/employees/:uuid/leave/:id
leaveRouter.delete("/:id", requireApiKey("full"), async (req: AuthedRequest, res) => {
  const deleted = await deleteLeave(parseInt(req.params.id));
  if (!deleted) { res.status(404).json({ error: "Record not found" }); return; }
  res.json({ success: true });
});
