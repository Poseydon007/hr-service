import { drizzle } from "drizzle-orm/mysql2";
import { eq, like, or, and, isNull, lte } from "drizzle-orm";
import { employees, employeeDocuments, apiKeys } from "../drizzle/schema.js";
import type { InsertEmployee } from "../drizzle/schema.js";

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
  await db.delete(employees).where(eq(employees.uuid, uuid));
  return true;
}

// ── Documents ──────────────────────────────────────────────

export async function getDocumentsByEmployeeId(employeeId: number) {
  const db = getDb();
  return db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId));
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
