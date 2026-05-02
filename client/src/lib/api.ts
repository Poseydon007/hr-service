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

// ── Types ───────────────────────────────────────────────────────────────────

export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";
export type ContractType = "full_time" | "part_time" | "contract" | "intern";

export interface Employee {
  uuid: string;
  employeeCode: string;
  fullName: string;
  preferredName?: string;
  birthDate?: string;
  nationality?: string;
  nationalId?: string;
  personalPhone?: string;
  companyEmail?: string;
  department?: string;
  jobTitle?: string;
  contractType?: ContractType;
  hireDate?: string;
  location?: string;
  costCenter?: string;
  managerId?: number;
  iqamaNumber?: string;
  iqamaExpiry?: string;
  passportExpiry?: string;
  visaExpiry?: string;
  drivingLicenseExpiry?: string;
  authorizedApps?: string[];
  timezone?: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExpiringDoc {
  employeeUuid: string;
  employeeCode: string;
  fullName: string;
  department?: string;
  docType: string;
  expiryDate: string;
  daysLeft: number;
}

export interface ApiKey {
  id: number;
  appName: string;
  prefix: string;
  scope: string[];
  active: boolean;
  lastUsed?: string;
  createdAt: string;
}

export interface CreateKeyResponse {
  id: number;
  appName: string;
  prefix: string;
  scope: string[];
  rawKey: string;
}
