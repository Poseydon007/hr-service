import { drizzle } from "drizzle-orm/mysql2";
import { eq, lte, and, desc } from "drizzle-orm";
import {
  employees, employeeDocuments, apiKeys,
  employeeCompensation, employeeTimesheets, employeeLeave,
  employeeFunctions, employeeTraining,
} from "../drizzle/schema.js";
import type {
  InsertEmployee, InsertCompensation, InsertTimesheet, InsertLeave,
} from "../drizzle/schema.js";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    _db = drizzle(url);
  }
  return _db;
}

// ── Employees ──────────────────────────────────────────────

export async function getAllEmployees(opts?: {
  search?: string;
  department?: string;
  status?: string;
}) {
  const db = getDb();
  let rows = await db.select().from(employees);

  if (opts?.status) {
    rows = rows.filter(r => r.status === opts.status);
  }
  if (opts?.department) {
    rows = rows.filter(r => r.department?.toLowerCase() === opts.department!.toLowerCase());
  }
  if (opts?.search) {
    const s = opts.search.toLowerCase();
    rows = rows.filter(r =>
      r.fullName.toLowerCase().includes(s) ||
      r.department?.toLowerCase().includes(s) ||
      r.jobTitle?.toLowerCase().includes(s) ||
      r.employeeCode?.toLowerCase().includes(s)
    );
  }
  return rows;
}

export async function getEmployeeByUuid(uuid: string) {
  const db = getDb();
  const result = await db.select().from(employees).where(eq(employees.uuid, uuid)).limit(1);
  return result[0] ?? null;
}

export async function getEmployeeById(id: number) {
  const db = getDb();
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createEmployee(data: InsertEmployee) {
  const db = getDb();
  await db.insert(employees).values(data);
  const result = await db.select().from(employees).where(eq(employees.uuid, data.uuid)).limit(1);
  return result[0];
}

export async function updateEmployee(uuid: string, data: Partial<InsertEmployee>) {
  const db = getDb();
  await db.update(employees).set(data).where(eq(employees.uuid, uuid));
}

export async function deleteEmployee(uuid: string) {
  const db = getDb();
  const emp = await getEmployeeByUuid(uuid);
  if (!emp) return false;
  await db.delete(employeeDocuments).where(eq(employeeDocuments.employeeId, emp.id));
  await db.delete(employeeCompensation).where(eq(employeeCompensation.employeeId, emp.id));
  await db.delete(employeeTimesheets).where(eq(employeeTimesheets.employeeId, emp.id));
  await db.delete(employeeLeave).where(eq(employeeLeave.employeeId, emp.id));
  await db.delete(employeeFunctions).where(eq(employeeFunctions.employeeId, emp.id));
  await db.delete(employeeTraining).where(eq(employeeTraining.employeeId, emp.id));
  await db.delete(employees).where(eq(employees.uuid, uuid));
  return true;
}

// ── Documents ──────────────────────────────────────────────

export async function getDocumentsByEmployeeId(employeeId: number) {
  const db = getDb();
  return db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId));
}

// ── Compensation ───────────────────────────────────────────

export async function getCompensationByEmployeeId(employeeId: number) {
  const db = getDb();
  return db.select().from(employeeCompensation)
    .where(eq(employeeCompensation.employeeId, employeeId))
    .orderBy(desc(employeeCompensation.effectiveDate));
}

export async function createCompensation(data: InsertCompensation) {
  const db = getDb();
  const result = await db.insert(employeeCompensation).values(data);
  const inserted = await db.select().from(employeeCompensation)
    .where(eq(employeeCompensation.id, (result as any).insertId)).limit(1);
  return inserted[0];
}

export async function updateCompensation(id: number, data: Partial<InsertCompensation>) {
  const db = getDb();
  await db.update(employeeCompensation).set(data).where(eq(employeeCompensation.id, id));
  const result = await db.select().from(employeeCompensation).where(eq(employeeCompensation.id, id)).limit(1);
  return result[0] ?? null;
}

export async function deleteCompensation(id: number) {
  const db = getDb();
  const existing = await db.select().from(employeeCompensation).where(eq(employeeCompensation.id, id)).limit(1);
  if (!existing[0]) return false;
  await db.delete(employeeCompensation).where(eq(employeeCompensation.id, id));
  return true;
}

// ── Timesheets ─────────────────────────────────────────────

export async function getTimesheetsByEmployeeId(employeeId: number, opts?: { status?: string }) {
  const db = getDb();
  let rows = await db.select().from(employeeTimesheets)
    .where(eq(employeeTimesheets.employeeId, employeeId))
    .orderBy(desc(employeeTimesheets.workDate));
  if (opts?.status) rows = rows.filter(r => r.status === opts.status);
  return rows;
}

export async function createTimesheet(data: InsertTimesheet) {
  const db = getDb();
  const result = await db.insert(employeeTimesheets).values(data);
  const inserted = await db.select().from(employeeTimesheets)
    .where(eq(employeeTimesheets.id, (result as any).insertId)).limit(1);
  return inserted[0];
}

export async function updateTimesheet(id: number, data: Partial<InsertTimesheet>) {
  const db = getDb();
  await db.update(employeeTimesheets).set(data).where(eq(employeeTimesheets.id, id));
  const result = await db.select().from(employeeTimesheets).where(eq(employeeTimesheets.id, id)).limit(1);
  return result[0] ?? null;
}

export async function deleteTimesheet(id: number) {
  const db = getDb();
  const existing = await db.select().from(employeeTimesheets).where(eq(employeeTimesheets.id, id)).limit(1);
  if (!existing[0]) return false;
  await db.delete(employeeTimesheets).where(eq(employeeTimesheets.id, id));
  return true;
}

// ── Leave ──────────────────────────────────────────────────

export async function getLeaveByEmployeeId(employeeId: number, opts?: { status?: string; leaveType?: string }) {
  const db = getDb();
  let rows = await db.select().from(employeeLeave)
    .where(eq(employeeLeave.employeeId, employeeId))
    .orderBy(desc(employeeLeave.startDate));
  if (opts?.status) rows = rows.filter(r => r.status === opts.status);
  if (opts?.leaveType) rows = rows.filter(r => r.leaveType === opts.leaveType);
  return rows;
}

export async function createLeave(data: InsertLeave) {
  const db = getDb();
  const result = await db.insert(employeeLeave).values(data);
  const inserted = await db.select().from(employeeLeave)
    .where(eq(employeeLeave.id, (result as any).insertId)).limit(1);
  return inserted[0];
}

export async function updateLeave(id: number, data: Partial<InsertLeave>) {
  const db = getDb();
  await db.update(employeeLeave).set(data).where(eq(employeeLeave.id, id));
  const result = await db.select().from(employeeLeave).where(eq(employeeLeave.id, id)).limit(1);
  return result[0] ?? null;
}

export async function deleteLeave(id: number) {
  const db = getDb();
  const existing = await db.select().from(employeeLeave).where(eq(employeeLeave.id, id)).limit(1);
  if (!existing[0]) return false;
  await db.delete(employeeLeave).where(eq(employeeLeave.id, id));
  return true;
}

// ── Functions ──────────────────────────────────────────────

export async function getFunctionsByEmployeeId(employeeId: number) {
  const db = getDb();
  return db.select().from(employeeFunctions).where(eq(employeeFunctions.employeeId, employeeId));
}

export async function createFunction(data: { employeeId: number; functionTitle: string; functionCode?: string; description?: string; competencyLevel?: number; certifiedDate?: string; expiryDate?: string }) {
  const db = getDb();
  const result = await db.insert(employeeFunctions).values(data);
  const inserted = await db.select().from(employeeFunctions)
    .where(eq(employeeFunctions.id, (result as any).insertId)).limit(1);
  return inserted[0];
}

export async function updateFunction(id: number, data: Partial<{ functionTitle: string; functionCode: string; description: string; competencyLevel: number; certifiedDate: string; expiryDate: string }>) {
  const db = getDb();
  await db.update(employeeFunctions).set(data).where(eq(employeeFunctions.id, id));
  const result = await db.select().from(employeeFunctions).where(eq(employeeFunctions.id, id)).limit(1);
  return result[0] ?? null;
}

export async function deleteFunction(id: number) {
  const db = getDb();
  const existing = await db.select().from(employeeFunctions).where(eq(employeeFunctions.id, id)).limit(1);
  if (!existing[0]) return false;
  await db.delete(employeeFunctions).where(eq(employeeFunctions.id, id));
  return true;
}

// ── Training ───────────────────────────────────────────────

export async function getTrainingByEmployeeId(employeeId: number) {
  const db = getDb();
  return db.select().from(employeeTraining)
    .where(eq(employeeTraining.employeeId, employeeId))
    .orderBy(desc(employeeTraining.completionDate));
}

export async function createTraining(data: { employeeId: number; courseName: string; provider?: string; completionDate?: string; expiryDate?: string; certificateUrl?: string; status?: "completed" | "in_progress" | "expired"; notes?: string }) {
  const db = getDb();
  const result = await db.insert(employeeTraining).values(data);
  const inserted = await db.select().from(employeeTraining)
    .where(eq(employeeTraining.id, (result as any).insertId)).limit(1);
  return inserted[0];
}

export async function updateTraining(id: number, data: Partial<{ courseName: string; provider: string; completionDate: string; expiryDate: string; certificateUrl: string; status: string; notes: string }>) {
  const db = getDb();
  await db.update(employeeTraining).set(data).where(eq(employeeTraining.id, id));
  const result = await db.select().from(employeeTraining).where(eq(employeeTraining.id, id)).limit(1);
  return result[0] ?? null;
}

export async function deleteTraining(id: number) {
  const db = getDb();
  const existing = await db.select().from(employeeTraining).where(eq(employeeTraining.id, id)).limit(1);
  if (!existing[0]) return false;
  await db.delete(employeeTraining).where(eq(employeeTraining.id, id));
  return true;
}

// ── API Keys ───────────────────────────────────────────────

export async function getApiKeyByHash(hash: string) {
  const db = getDb();
  const result = await db.select().from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hash), eq(apiKeys.active, true)))
    .limit(1);
  return result[0] ?? null;
}

export async function touchApiKey(id: number) {
  const db = getDb();
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
}

// ── Expiry Dashboard ───────────────────────────────────────

export async function getExpiringDocuments(withinDays = 60) {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return db.select().from(employeeDocuments)
    .where(lte(employeeDocuments.expiryDate, cutoffStr));
}
