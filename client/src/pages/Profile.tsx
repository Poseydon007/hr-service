import { useEffect, useState, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Employee, type EmployeeStatus, type ContractType } from "../lib/api.ts";
import StatusBadge from "../components/StatusBadge.tsx";
import ExpiryBadge from "../components/ExpiryBadge.tsx";

type Tab = "personal" | "work" | "compliance" | "apps";

const CONTRACT_TYPES: ContractType[] = ["full_time", "part_time", "contract", "intern"];

export default function Profile() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tab, setTab] = useState<Tab>("personal");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form state
  const [form, setForm] = useState<Partial<Employee>>({});
  const [appInput, setAppInput] = useState("");

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    api
      .get<Employee>(`/employees/${uuid}`)
      .then((data) => {
        if (cancelled) return;
        setEmployee(data);
        setForm(data);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uuid]);

  function set<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!uuid) return;
    setSaving(true);
    setError("");
    setSaveSuccess(false);
    try {
      const updated = await api.patch<Employee>(`/employees/${uuid}`, form);
      setEmployee(updated);
      setForm(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!uuid) return;
    try {
      await api.delete(`/employees/${uuid}`);
      navigate("/employees");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function addApp() {
    const val = appInput.trim();
    if (!val) return;
    const apps = form.authorizedApps ?? [];
    if (!apps.includes(val)) {
      set("authorizedApps", [...apps, val]);
    }
    setAppInput("");
  }

  function removeApp(app: string) {
    set("authorizedApps", (form.authorizedApps ?? []).filter((a) => a !== app));
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 rounded" /><div className="bg-white rounded-xl border h-96" /></div>;
  if (!employee) return <div className="text-red-600 text-sm">Employee not found.</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "personal", label: "Personal" },
    { id: "work", label: "Work" },
    { id: "compliance", label: "Compliance" },
    { id: "apps", label: "Apps" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/employees")} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
        <h1 className="text-xl font-semibold text-gray-800">{employee.fullName}</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {saveSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">Changes saved.</div>}

      <form onSubmit={handleSave}>
        <div className="flex gap-5">
          {/* Sidebar */}
          <div className="w-52 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center space-y-3">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: "#0f2044" }}
              >
                {employee.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{employee.fullName}</div>
                <div className="text-xs font-mono text-gray-400 mt-0.5">{employee.employeeCode}</div>
              </div>
              <StatusBadge status={employee.status as EmployeeStatus} />
              <div className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                Created<br />
                {new Date(employee.createdAt).toLocaleDateString("en-GB")}
              </div>
            </div>

            {/* Status change */}
            <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Status</label>
              <select
                value={form.status ?? employee.status}
                onChange={(e) => set("status", e.target.value as EmployeeStatus)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Main Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

              <div className="p-6 space-y-5">
                {/* Personal Tab */}
                {tab === "personal" && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name" value={form.fullName} onChange={(v) => set("fullName", v)} />
                    <Field label="Preferred Name" value={form.preferredName} onChange={(v) => set("preferredName", v)} />
                    <Field label="Birth Date" value={form.birthDate} onChange={(v) => set("birthDate", v)} type="date" />
                    <Field label="Nationality" value={form.nationality} onChange={(v) => set("nationality", v)} />
                    <Field label="National ID" value={form.nationalId} onChange={(v) => set("nationalId", v)} />
                    <Field label="Personal Phone" value={form.personalPhone} onChange={(v) => set("personalPhone", v)} />
                    <Field label="Company Email" value={form.companyEmail} onChange={(v) => set("companyEmail", v)} type="email" className="col-span-2" />
                  </div>
                )}

                {/* Work Tab */}
                {tab === "work" && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Department" value={form.department} onChange={(v) => set("department", v)} />
                    <Field label="Job Title" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contract Type</label>
                      <select
                        value={form.contractType ?? ""}
                        onChange={(e) => set("contractType", e.target.value as ContractType)}
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
                    <Field
                      label="Manager ID"
                      value={form.managerId != null ? String(form.managerId) : ""}
                      onChange={(v) => set("managerId", v ? Number(v) : undefined)}
                      type="number"
                    />
                  </div>
                )}

                {/* Compliance Tab */}
                {tab === "compliance" && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Iqama Number" value={form.iqamaNumber} onChange={(v) => set("iqamaNumber", v)} />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Iqama Expiry</label>
                      <div className="flex items-center gap-3">
                        <input type="date" value={form.iqamaExpiry ?? ""} onChange={(e) => set("iqamaExpiry", e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1" />
                        <ExpiryBadge dateStr={form.iqamaExpiry} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Passport Expiry</label>
                      <div className="flex items-center gap-3">
                        <input type="date" value={form.passportExpiry ?? ""} onChange={(e) => set("passportExpiry", e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1" />
                        <ExpiryBadge dateStr={form.passportExpiry} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Visa Expiry</label>
                      <div className="flex items-center gap-3">
                        <input type="date" value={form.visaExpiry ?? ""} onChange={(e) => set("visaExpiry", e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1" />
                        <ExpiryBadge dateStr={form.visaExpiry} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Driving License Expiry</label>
                      <div className="flex items-center gap-3">
                        <input type="date" value={form.drivingLicenseExpiry ?? ""} onChange={(e) => set("drivingLicenseExpiry", e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1" />
                        <ExpiryBadge dateStr={form.drivingLicenseExpiry} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Apps Tab */}
                {tab === "apps" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Authorized Apps</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(form.authorizedApps ?? []).map((app) => (
                          <span
                            key={app}
                            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium"
                          >
                            {app}
                            <button
                              type="button"
                              onClick={() => removeApp(app)}
                              className="text-blue-400 hover:text-blue-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {(form.authorizedApps ?? []).length === 0 && (
                          <span className="text-sm text-gray-400">No apps authorized.</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type app name and press Enter"
                          value={appInput}
                          onChange={(e) => setAppInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addApp();
                            }
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1"
                        />
                        <button type="button" onClick={addApp}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700">
                          Add
                        </button>
                      </div>
                    </div>
                    <Field label="Timezone" value={form.timezone} onChange={(v) => set("timezone", v)} placeholder="e.g. Asia/Riyadh" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Delete Employee
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#c9a84c" }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Delete Employee?</h3>
            <p className="text-sm text-gray-600">
              This will permanently delete <strong>{employee.fullName}</strong> ({employee.employeeCode}). This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}

function Field({ label, value, onChange, type = "text", placeholder, className }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
}
