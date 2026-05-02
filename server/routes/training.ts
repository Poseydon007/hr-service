import { Router } from "express";
import { z } from "zod";
import { requireApiKey, type AuthedRequest } from "../middleware/apiKey.js";
import {
  getEmployeeByUuid,
  getTrainingByEmployeeId,
  createTraining,
  updateTraining,
  deleteTraining,
} from "../db.js";

export const trainingRouter = Router({ mergeParams: true });

const TrainSchema = z.object({
  courseName:      z.string().min(1),
  provider:        z.string().optional(),
  completionDate:  z.string().optional(),
  expiryDate:      z.string().optional(),
  certificateUrl:  z.string().optional(),
  status:          z.enum(["completed", "in_progress", "expired"]).default("completed"),
  notes:           z.string().optional(),
});

// GET /v1/employees/:uuid/training
trainingRouter.get("/", requireApiKey("read:internal"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const rows = await getTrainingByEmployeeId(emp.id);
  res.json(rows);
});

// POST /v1/employees/:uuid/training
trainingRouter.post("/", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = TrainSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await createTraining({ employeeId: emp.id, ...parsed.data });
  res.status(201).json(row);
});

// PATCH /v1/employees/:uuid/training/:id
trainingRouter.patch("/:id", requireApiKey("write"), async (req: AuthedRequest, res) => {
  const emp = await getEmployeeByUuid(req.params.uuid);
  if (!emp) { res.status(404).json({ error: "Employee not found" }); return; }
  const parsed = TrainSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await updateTraining(parseInt(req.params.id), parsed.data);
  if (!row) { res.status(404).json({ error: "Record not found" }); return; }
  res.json(row);
});

// DELETE /v1/employees/:uuid/training/:id
trainingRouter.delete("/:id", requireApiKey("full"), async (req: AuthedRequest, res) => {
  const deleted = await deleteTraining(parseInt(req.params.id));
  if (!deleted) { res.status(404).json({ error: "Record not found" }); return; }
  res.json({ success: true });
});
