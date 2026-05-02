import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { getApiKeyByHash, touchApiKey } from "../db.js";

export interface AuthedRequest extends Request {
  apiKey?: { id: number; appName: string; scope: string[] };
}

function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function requireApiKey(requiredScope?: string) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const raw = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!raw) {
      res.status(401).json({ error: "Missing API key" });
      return;
    }

    const hash = hashKey(raw);
    const key = await getApiKeyByHash(hash);

    if (!key) {
      res.status(401).json({ error: "Invalid or inactive API key" });
      return;
    }

    if (requiredScope && !key.scope.includes(requiredScope) && !key.scope.includes("full")) {
      res.status(403).json({ error: `Scope '${requiredScope}' required` });
      return;
    }

    req.apiKey = { id: key.id, appName: key.appName, scope: key.scope as string[] };
    touchApiKey(key.id).catch(() => {}); // fire-and-forget
    next();
  };
}

// Scope helpers — applied per-route in the response layer
export function filterByScope(employee: Record<string, unknown>, scope: string[]) {
  const isInternal = scope.includes("read:internal") || scope.includes("full");
  const isSensitive = scope.includes("read:sensitive") || scope.includes("full");

  const pub = {
    uuid: employee.uuid,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    preferredName: employee.preferredName,
    department: employee.department,
    jobTitle: employee.jobTitle,
    profilePictureUrl: employee.profilePictureUrl,
    status: employee.status,
    location: employee.location,
    timezone: employee.timezone,
    authorizedApps: employee.authorizedApps,
  };

  if (!isInternal) return pub;

  const internal = {
    ...pub,
    companyEmail: employee.companyEmail,
    hireDate: employee.hireDate,
    contractType: employee.contractType,
    costCenter: employee.costCenter,
    managerId: employee.managerId,
    personalPhone: employee.personalPhone,
  };

  if (!isSensitive) return internal;

  return {
    ...internal,
    birthDate: employee.birthDate,
    nationalId: employee.nationalId,
    iqamaNumber: employee.iqamaNumber,
    iqamaExpiry: employee.iqamaExpiry,
    passportExpiry: employee.passportExpiry,
    visaExpiry: employee.visaExpiry,
    drivingLicenseExpiry: employee.drivingLicenseExpiry,
    nationality: employee.nationality,
  };
}
