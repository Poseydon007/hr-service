const BASE = "/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getKey(): string {
  return sessionStorage.getItem("hr_admin_key") ?? "";
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const key = getKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (key) {
    headers["Authorization"] = `Bearer ${key}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    sessionStorage.removeItem("hr_admin_key");
    window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ── Core Types ───────────────────────────────────────────────────────────────

export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";
export type ContractType   = "permanent" | "contract" | "secondment";
export type WorkerType     = "employee" | "subcontractor" | "consultant";

export interface Employee {
  uuid:                 string;
  employeeCode:         string;
  fullName:             string;
  preferredName?:       string;
  birthDate?:           string;
  nationality?:         string;
  nationalId?:          string;
  personalPhone?:       string;
  companyEmail?:        string;
  department?:          string;
  jobTitle?:            string;
  contractType?:        ContractType;
  workerType?:          WorkerType;
  sponsorCompany?:      string;
  hireDate?:            string;
  location?:            string;
  costCenter?:          string;
  managerId?:           number;
  iqamaNumber?:         string;
  iqamaExpiry?:         string;
  passportExpiry?:      string;
  visaExpiry?:          string;
  drivingLicenseExpiry?:string;
  timezone?:            string;
  status:               EmployeeStatus;
  createdAt:            string;
  updatedAt:            string;
}

// ── Sub-resource Types ───────────────────────────────────────────────────────

export interface Compensation {
  id:                 number;
  employeeId:         number;
  effectiveDate:      string;
  currency:           string;
  basicSalary?:       string;
  housingAllowance?:  string;
  transportAllowance?:string;
  otherAllowances?:   string;
  bankName?:          string;
  bankIban?:          string;
  paymentMethod?:     "bank_transfer" | "cash" | "cheque";
  notes?:             string;
  createdAt:          string;
}

export interface Timesheet {
  id:              number;
  employeeId:      number;
  workDate:        string;
  hoursRegular:    string;
  hoursOvertime:   string;
  siteLocation?:   string;
  projectCode?:    string;
  status:          "draft" | "submitted" | "approved" | "rejected";
  approvedByUuid?: string;
  notes?:          string;
  createdAt:       string;
}

export interface Leave {
  id:              number;
  employeeId:      number;
  leaveType:       "annual" | "sick" | "emergency" | "unpaid" | "maternity" | "hajj" | "other";
  startDate:       string;
  endDate:         string;
  days:            number;
  status:          "pending" | "approved" | "rejected" | "cancelled";
  approvedByUuid?: string;
  reason?:         string;
  notes?:          string;
  createdAt:       string;
}

export interface EmployeeFunction {
  id:               number;
  employeeId:       number;
  functionTitle:    string;
  functionCode?:    string;
  description?:     string;
  competencyLevel?: number;
  certifiedDate?:   string;
  expiryDate?:      string;
  createdAt:        string;
}

export interface Training {
  id:              number;
  employeeId:      number;
  courseName:      string;
  provider?:       string;
  completionDate?: string;
  expiryDate?:     string;
  certificateUrl?: string;
  status:          "completed" | "in_progress" | "expired";
  notes?:          string;
  createdAt:       string;
}

// ── Other Types ──────────────────────────────────────────────────────────────

export interface ExpiringDoc {
  employeeUuid: string;
  employeeCode: string;
  fullName:     string;
  department?:  string;
  docType:      string;
  expiryDate:   string;
  daysLeft:     number;
}

export interface ApiKey {
  id:        number;
  appName:   string;
  prefix:    string;
  scope:     string[];
  active:    boolean;
  lastUsed?: string;
  createdAt: string;
}

export interface CreateKeyResponse {
  id:      number;
  appName: string;
  prefix:  string;
  scope:   string[];
  rawKey:  string;
}
