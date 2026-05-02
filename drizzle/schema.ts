import { mysqlTable, int, varchar, text, date, timestamp, mysqlEnum, json, boolean } from "drizzle-orm/mysql-core";

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
  nationalId:            varchar("national_id", { length: 100 }),   // iqama / Saudi ID
  profilePictureUrl:     text("profile_picture_url"),
  personalPhone:         varchar("personal_phone", { length: 50 }),

  // Work Context
  department:            varchar("department", { length: 100 }),
  jobTitle:              varchar("job_title", { length: 150 }),
  managerId:             int("manager_id"),                          // self-ref FK, handled in app layer
  costCenter:            varchar("cost_center", { length: 100 }),
  hireDate:              date("hire_date"),
  contractType:          mysqlEnum("contract_type", ["permanent", "contract", "secondment"]),
  location:              varchar("location", { length: 150 }).default("Dammam, KSA"),

  // KSA Compliance — expiry tracking
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

export const employeeDocuments = mysqlTable("employee_documents", {
  id:          int("id").autoincrement().primaryKey(),
  employeeId:  int("employee_id").notNull(),
  docType:     varchar("doc_type", { length: 100 }).notNull(), // iqama, passport, contract, visa, other
  fileUrl:     text("file_url"),
  issuedDate:  date("issued_date"),
  expiryDate:  date("expiry_date"),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const apiKeys = mysqlTable("api_keys", {
  id:          int("id").autoincrement().primaryKey(),
  keyHash:     varchar("key_hash", { length: 255 }).notNull().unique(),
  keyPrefix:   varchar("key_prefix", { length: 10 }).notNull(),     // first 8 chars, for display
  appName:     varchar("app_name", { length: 100 }).notNull(),
  scope:       json("scope").$type<string[]>().notNull().default([]),
  active:      boolean("active").default(true).notNull(),
  lastUsedAt:  timestamp("last_used_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
