import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Employee, type EmployeeStatus, type ContractType } from "../lib/api.ts";

type Tab = "personal" | "work";

const CONTRACT_TYPES: ContractType[] = ["full_time", "part_time", "contract", "intern"];

interface FormData {
  fullName: string;
  preferredName: string;
  birthDate: string;
  nationality: string;
  nationalId: string;
  personalPhone: string;
  companyEmail: string;
  department: string;
  jobTitle: string;
  contractType: ContractType | "";
  hireDate: string;
  location: string;
  costCenter: string;
  managerId: string;
  status: EmployeeStatus;
}

const EMPTY: FormData = {
  fullName: "",
  preferredName: "",
  birthDate: "",
  nationality: "",
  nationalId: "",
  personalPhone: "",
  companyEmail: "",
  department: "",
  jobTitle: "",
  contractType: "",
  hireDate: "",
  location: "",
  costCenter: "",
  managerId: "",
  status: "active",
};

export default function NewEmployee() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [tab, setTab] = useState<Tab>("personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: Partial<Employee> = {
        fullName: form.fullName,
        preferredName: form.preferredName || undefined,
        birthDate: form.birthDate || undefined,
        nationality: form.nationality || undefined,
        nationalId: form.nationalId || undefined,
        personalPhone: form.personalPhone || undefined,
        companyEmail: form.companyEmail || undefined,
        department: form.department || undefined,
        jobTitle: form.jobTitle || undefined,
        contractType: (form.contractType as ContractType) || undefined,
        hireDate: form.hireDate || undefined,
        location: form.location || undefined,
        costCenter: form.costCenter || undefined,
        managerId: form.managerId ? Number(form.managerId) : undefined,
        status: form.status,
      };
      const created = await api.post<Employee>("/employees", payload);
      navigate(`/employees/${created.uuid}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "personal", label: "Personal" },
    { id: "work", label: "Work" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/employees")} className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-gray-800">New Employee</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "border-b-2 text-[#0f2044]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={tab === t.id ? { borderBottomColor: "#c9a84c" } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {tab === "personal" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name *" value={form.fullName} onChange={(v) => set("fullName", v)} required />
                <Field label="Preferred Name" value={form.preferredName} onChange={(v) => set("preferredName", v)} />
                <Field label="Birth Date" value={form.birthDate} onChange={(v) => set("birthDate", v)} type="date" />
                <Field label="Nationality" value={form.nationality} onChange={(v) => set("nationality", v)} />
                <Field label="National ID" value={form.nationalId} onChange={(v) => set("nationalId", v)} />
                <Field label="Personal Phone" value={form.personalPhone} onChange={(v) => set("personalPhone", v)} />
                <Field label="Company Email" value={form.companyEmail} onChange={(v) => set("companyEmail", v)} type="email" className="col-span-2" />
              </div>
            )}

            {tab === "work" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Department" value={form.department} onChange={(v) => set("department", v)} />
                <Field label="Job Title" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Contract Type
                  </label>
                  <select
                    value={form.contractType}
                    onChange={(e) => set("contractType", e.target.value as ContractType | "")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">— select —</option>
                    {CONTRACT_TYPES.map((c) => (
                      <option key={c} value={c}>{c.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <Field label="Hire Date" value={form.hireDate} onChange={(v) => set("hireDate", v)} type="date" />
                <Field label="Location" value={form.location} onChange={(v) => set("location", v)} />
                <Field label="Cost Center" value={form.costCenter} onChange={(v) => set("costCenter", v)} />
                <Field label="Manager ID" value={form.managerId} onChange={(v) => set("managerId", v)} type="number" />
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as EmployeeStatus)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#c9a84c" }}
            >
              {saving ? "Creating…" : "Create Employee"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

function Field({ label, value, onChange, type = "text", placeholder, className, required }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
}
