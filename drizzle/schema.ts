import { mysqlTable, int, varchar, text, date, timestamp, mysqlEnum, json, boolean, decimal } from "drizzle-orm/mysql-core";

// ── Core employee record ────────────────────────────────────────────────────

export const employees = mysqlTable("employees", {
  id:                    int("id").autoincrement().primaryKey(),
  uuid:                  varchar("uuid", { length: 36 }).unique().notNull(),
  employeeCode:          varchar("employee_code", { length: 32 }).unique(),
  companyEmail:          varchar("company_email", { length: 255 }).unique(),
  status:                mysqlEnum("status", ["active", "inactive", "on_leave", "terminated"]).default("active").notNull(),

  // Personal
  fullName:              varchar("full_name", { length: 255 }).notNull(),
  preferredName:         varchar("preferred_name", { length: 255 }),
  birthDate:             date("birth_date"),
  nationality:           varchar("nationality", { length: 100 }),
  nationalId:            varchar("national_id", { length: 100 }),
  profilePictureUrl:     text("profile_picture_url"),
  personalPhone:         varchar("personal_phone", { length: 50 }),

  // Work Context
  department:            varchar("department", { length: 100 }),
  jobTitle:              varchar("job_title", { length: 150 }),
  managerId:             int("manager_id"),
  costCenter:            varchar("cost_center", { length: 100 }),
  hireDate:              date("hire_date"),
  contractType:          mysqlEnum("contract_type", ["permanent", "contract", "secondment"]),
  workerType:            mysqlEnum("worker_type", ["employee", "subcontractor", "consultant"]).default("employee").notNull(),
  sponsorCompany:        varchar("sponsor_company", { length: 255 }),   // for subcontractors — name of their sponsoring entity
  location:              varchar("location", { length: 150 }).default("Dammam, KSA"),

  // KSA Compliance
  iqamaNumber:           varchar("iqama_number", { length: 50 }),
  iqamaExpiry:           date("iqama_expiry"),
  passportExpiry:        date("passport_expiry"),
  visaExpiry:            date("visa_expiry"),
  drivingLicenseExpiry:  date("driving_license_expiry"),

  // App Metadata
  authorizedApps:        json("authorized_apps").$type<string[]>().default([]),
  timezone:              varchar("timezone", { length: 50 }).default("Asia/Riyadh"),

  createdAt:             timestamp("created_at").defaultNow().notNull(),
  updatedAt:             timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ── Documents ───────────────────────────────────────────────────────────────

export const employeeDocuments = mysqlTable("employee_documents", {
  id:          int("id").autoincrement().primaryKey(),
  employeeId:  int("employee_id").notNull(),
  docType:     varchar("doc_type", { length: 100 }).notNull(),
  fileUrl:     text("file_url"),
  issuedDate:  date("issued_date"),
  expiryDate:  date("expiry_date"),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ── Compensation ────────────────────────────────────────────────────────────

export const employeeCompensation = mysqlTable("employee_compensation", {
  id:                  int("id").autoincrement().primaryKey(),
  employeeId:          int("employee_id").notNull(),
  effectiveDate:       date("effective_date").notNull(),
  currency:            varchar("currency", { length: 10 }).default("SAR").notNull(),
  basicSalary:         decimal("basic_salary", { precision: 12, scale: 2 }),
  housingAllowance:    decimal("housing_allowance", { precision: 12, scale: 2 }),
  transportAllowance:  decimal("transport_allowance", { precision: 12, scale: 2 }),
  otherAllowances:     decimal("other_allowances", { precision: 12, scale: 2 }),
  // Banking
  bankName:            varchar("bank_name", { length: 150 }),
  bankIban:            varchar("bank_iban", { length: 50 }),
  paymentMethod:       mysqlEnum("payment_method", ["bank_transfer", "cash", "cheque"]).default("bank_transfer"),
  notes:               text("notes"),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
  updatedAt:           timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ── Timesheets ──────────────────────────────────────────────────────────────

export const employeeTimesheets = mysqlTable("employee_timesheets", {
  id:             int("id").autoincrement().primaryKey(),
  employeeId:     int("employee_id").notNull(),
  workDate:       date("work_date").notNull(),
  hoursRegular:   decimal("hours_regular", { precision: 5, scale: 2 }).default("8.00"),
  hoursOvertime:  decimal("hours_overtime", { precision: 5, scale: 2 }).default("0.00"),
  siteLocation:   varchar("site_location", { length: 150 }),
  projectCode:    varchar("project_code", { length: 50 }),
  status:         mysqlEnum("status", ["draft", "submitted", "approved", "rejected"]).default("draft").notNull(),
  approvedByUuid: varchar("approved_by_uuid", { length: 36 }),
  notes:          text("notes"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ── Leave ───────────────────────────────────────────────────────────────────

export const employeeLeave = mysqlTable("employee_leave", {
  id:             int("id").autoincrement().primaryKey(),
  employeeId:     int("employee_id").notNull(),
  leaveType:      mysqlEnum("leave_type", ["annual", "sick", "emergency", "unpaid", "maternity", "hajj", "other"]).notNull(),
  startDate:      date("start_date").notNull(),
  endDate:        date("end_date").notNull(),
  days:           int("days").notNull(),
  status:         mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  approvedByUuid: varchar("approved_by_uuid", { length: 36 }),
  reason:         text("reason"),
  notes:          text("notes"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ── Functions & Competencies ────────────────────────────────────────────────

export const employeeFunctions = mysqlTable("employee_functions", {
  id:               int("id").autoincrement().primaryKey(),
  employeeId:       int("employee_id").notNull(),
  functionCode:     varchar("function_code", { length: 50 }),
  functionTitle:    varchar("function_title", { length: 150 }).notNull(),
  description:      text("description"),
  competencyLevel:  int("competency_level"),   // 1–5
  certifiedDate:    date("certified_date"),
  expiryDate:       date("expiry_date"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
});

// ── Training & Certifications ───────────────────────────────────────────────

export const employeeTraining = mysqlTable("employee_training", {
  id:              int("id").autoincrement().primaryKey(),
  employeeId:      int("employee_id").notNull(),
  courseName:      varchar("course_name", { length: 255 }).notNull(),
  provider:        varchar("provider", { length: 150 }),
  completionDate:  date("completion_date"),
  expiryDate:      date("expiry_date"),
  certificateUrl:  text("certificate_url"),
  status:          mysqlEnum("status", ["completed", "in_progress", "expired"]).default("completed").notNull(),
  notes:           text("notes"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
});

// ── API Keys ────────────────────────────────────────────────────────────────

export const apiKeys = mysqlTable("api_keys", {
  id:          int("id").autoincrement().primaryKey(),
  keyHash:     varchar("key_hash", { length: 255 }).notNull().unique(),
  keyPrefix:   varchar("key_prefix", { length: 10 }).notNull(),
  appName:     varchar("app_name", { length: 100 }).notNull(),
  scope:       json("scope").$type<string[]>().notNull().default([]),
  active:      boolean("active").default(true).notNull(),
  lastUsedAt:  timestamp("last_used_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ── Types ────────────────────────────────────────────────────────────────────

export type Employee             = typeof employees.$inferSelect;
export type InsertEmployee       = typeof employees.$inferInsert;
export type EmployeeDocument     = typeof employeeDocuments.$inferSelect;
export type EmployeeCompensation = typeof employeeCompensation.$inferSelect;
export type InsertCompensation   = typeof employeeCompensation.$inferInsert;
export type EmployeeTimesheet    = typeof employeeTimesheets.$inferSelect;
export type InsertTimesheet      = typeof employeeTimesheets.$inferInsert;
export type EmployeeLeave        = typeof employeeLeave.$inferSelect;
export type InsertLeave          = typeof employeeLeave.$inferInsert;
export type EmployeeFunction     = typeof employeeFunctions.$inferSelect;
export type EmployeeTraining     = typeof employeeTraining.$inferSelect;
export type ApiKey               = typeof apiKeys.$inferSelect;
