import { useEffect, useState, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  api,
  type Employee, type EmployeeStatus, type ContractType, type WorkerType,
  type Compensation, type Timesheet, type Leave, type EmployeeFunction, type Training,
} from "../lib/api.ts";
import StatusBadge from "../components/StatusBadge.tsx";
import ExpiryBadge from "../components/ExpiryBadge.tsx";

type Tab = "personal" | "work" | "compliance" | "compensation" | "timesheets" | "leave" | "functions" | "training";

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "permanent",   label: "Permanent" },
  { value: "contract",    label: "Contract" },
  { value: "secondment",  label: "Secondment" },
];

const WORKER_TYPES: { value: WorkerType; label: string; hint: string }[] = [
  { value: "employee",      label: "Employee",      hint: "Under True East sponsorship" },
  { value: "subcontractor", label: "Subcontractor", hint: "Sponsored by another company" },
  { value: "consultant",    label: "Consultant",    hint: "Advisory / project-based" },
];

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
  const [form, setForm] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    api.get<Employee>(`/employees/${uuid}`)
      .then((data) => { if (!cancelled) { setEmployee(data); setForm(data); } })
      .catch((err) => { if (!cancelled) setError((err as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uuid]);

  function set<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!uuid) return;
    setSaving(true); setError(""); setSaveSuccess(false);
    try {
      const updated = await api.patch<Employee>(`/employees/${uuid}`, form);
      setEmployee(updated); setForm(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!uuid) return;
    try { await api.delete(`/employees/${uuid}`); navigate("/employees"); }
    catch (err) { setError((err as Error).message); }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 rounded" /><div className="bg-white rounded-xl border h-96" /></div>;
  if (!employee) return <div className="text-red-600 text-sm">Employee not found.</div>;

  const isSubcontractor = (form.workerType ?? employee.workerType) === "subcontractor";

  const tabs: { id: Tab; label: string }[] = [
    { id: "personal",     label: "Personal" },
    { id: "work",         label: "Work" },
    { id: "compliance",   label: "Compliance" },
    { id: "compensation", label: "Compensation" },
    { id: "timesheets",   label: "Timesheets" },
    { id: "leave",        label: "Leave" },
    { id: "functions",    label: "Functions" },
    { id: "training",     label: "Training" },
  ];

  const isCoreTab = tab === "personal" || tab === "work" || tab === "compliance";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/employees")} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
        <h1 className="text-xl font-semibold text-gray-800">{employee.fullName}</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {saveSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">Changes saved.</div>}

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center space-y-3">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: "#0f2044" }}>
              {employee.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{employee.fullName}</div>
              <div className="text-xs font-mono text-gray-400 mt-0.5">{employee.employeeCode}</div>
              {employee.jobTitle && <div className="text-xs text-gray-400 mt-0.5">{employee.jobTitle}</div>}
              {employee.department && <div className="text-xs text-gray-500 mt-0.5 font-medium">{employee.department}</div>}
            </div>
            <StatusBadge status={employee.status as EmployeeStatus} />
            {employee.workerType && employee.workerType !== "employee" && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                {employee.workerType}
              </span>
            )}
            <div className="text-xs text-gray-400 pt-1 border-t border-gray-100">
              Created<br />{new Date(employee.createdAt).toLocaleDateString("en-GB")}
            </div>
          </div>
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

        {/* Main panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((t) => (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    tab === t.id ? "border-b-2 text-[#0f2044]" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={tab === t.id ? { borderBottomColor: "#c9a84c" } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Core tabs — wrapped in form for save */}
            {isCoreTab ? (
              <form onSubmit={handleSave}>
                <div className="p-6 space-y-5">
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

                  {tab === "work" && (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Department" value={form.department} onChange={(v) => set("department", v)} />
                      <Field label="Job Title" value={form.jobTitle} onChange={(v) => set("jobTitle", v)} />

                      {/* Worker Type */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Worker Type</label>
                        <select
                          value={form.workerType ?? employee.workerType ?? "employee"}
                          onChange={(e) => set("workerType", e.target.value as WorkerType)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                          {WORKER_TYPES.map((w) => (
                            <option key={w.value} value={w.value}>{w.label} — {w.hint}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sponsor Company — only shown for subcontractors */}
                      {isSubcontractor
                        ? <Field label="Sponsor Company" value={form.sponsorCompany} onChange={(v) => set("sponsorCompany", v)} placeholder="Company holding their iqama" />
                        : <div />
                      }

                      {/* Contract Type */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contract Type</label>
                        <select
                          value={form.contractType ?? ""}
                          onChange={(e) => set("contractType", e.target.value as ContractType)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                          <option value="">— select —</option>
                          {CONTRACT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>

                      <Field label="Hire Date" value={form.hireDate} onChange={(v) => set("hireDate", v)} type="date" />
                      <Field label="Location" value={form.location} onChange={(v) => set("location", v)} />
                      <Field label="Cost Center" value={form.costCenter} onChange={(v) => set("costCenter", v)} />
                      <Field label="Manager ID" value={form.managerId != null ? String(form.managerId) : ""} onChange={(v) => set("managerId", v ? Number(v) : undefined)} type="number" />
                      <Field label="Timezone" value={form.timezone} onChange={(v) => set("timezone", v)} placeholder="e.g. Asia/Riyadh" />
                    </div>
                  )}

                  {tab === "compliance" && (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Iqama Number" value={form.iqamaNumber} onChange={(v) => set("iqamaNumber", v)} />
                      <DateWithBadge label="Iqama Expiry" value={form.iqamaExpiry} onChange={(v) => set("iqamaExpiry", v)} />
                      <DateWithBadge label="Passport Expiry" value={form.passportExpiry} onChange={(v) => set("passportExpiry", v)} />
                      <DateWithBadge label="Visa Expiry" value={form.visaExpiry} onChange={(v) => set("visaExpiry", v)} />
                      <DateWithBadge label="Driving License Expiry" value={form.drivingLicenseExpiry} onChange={(v) => set("drivingLicenseExpiry", v)} />
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                    Delete Employee
                  </button>
                  <button type="submit" disabled={saving}
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: "#c9a84c" }}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              /* Sub-resource tabs */
              <div className="p-6">
                {tab === "compensation" && uuid && <CompensationTab uuid={uuid} />}
                {tab === "timesheets"   && uuid && <TimesheetsTab uuid={uuid} />}
                {tab === "leave"        && uuid && <LeaveTab uuid={uuid} />}
                {tab === "functions"    && uuid && <FunctionsTab uuid={uuid} />}
                {tab === "training"     && uuid && <TrainingTab uuid={uuid} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Delete Employee?</h3>
            <p className="text-sm text-gray-600">
              This will permanently delete <strong>{employee.fullName}</strong> and all their records. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compensation Tab ─────────────────────────────────────────────────────────

function CompensationTab({ uuid }: { uuid: string }) {
  const [rows, setRows] = useState<Compensation[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Compensation>>({ currency: "SAR", paymentMethod: "bank_transfer" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Compensation[]>(`/employees/${uuid}/compensation`)
      .then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [uuid]);

  async function save() {
    setSaving(true);
    try {
      const row = await api.post<Compensation>(`/employees/${uuid}/compensation`, form);
      setRows((r) => [row, ...r]);
      setAdding(false);
      setForm({ currency: "SAR", paymentMethod: "bank_transfer" });
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    await api.delete(`/employees/${uuid}/compensation/${id}`);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (loading) return <LoadingRows />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Compensation History</h3>
        <button onClick={() => setAdding(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ backgroundColor: "#c9a84c" }}>+ Add Record</button>
      </div>

      {adding && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <MiniField label="Effective Date *" type="date" value={form.effectiveDate} onChange={(v) => setForm((f) => ({ ...f, effectiveDate: v }))} />
            <MiniField label="Currency" value={form.currency} onChange={(v) => setForm((f) => ({ ...f, currency: v }))} />
            <MiniField label="Basic Salary (SAR)" value={form.basicSalary} onChange={(v) => setForm((f) => ({ ...f, basicSalary: v }))} />
            <MiniField label="Housing Allowance" value={form.housingAllowance} onChange={(v) => setForm((f) => ({ ...f, housingAllowance: v }))} />
            <MiniField label="Transport Allowance" value={form.transportAllowance} onChange={(v) => setForm((f) => ({ ...f, transportAllowance: v }))} />
            <MiniField label="Other Allowances" value={form.otherAllowances} onChange={(v) => setForm((f) => ({ ...f, otherAllowances: v }))} />
            <MiniField label="Bank Name" value={form.bankName} onChange={(v) => setForm((f) => ({ ...f, bankName: v }))} />
            <MiniField label="IBAN" value={form.bankIban} onChange={(v) => setForm((f) => ({ ...f, bankIban: v }))} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
              <select value={form.paymentMethod ?? "bank_transfer"} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as Compensation["paymentMethod"] }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
          <MiniField label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
            <button onClick={save} disabled={saving || !form.effectiveDate} className="text-xs px-3 py-1.5 rounded text-white font-medium disabled:opacity-50" style={{ backgroundColor: "#c9a84c" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !adding && <EmptyState label="No compensation records yet." />}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-800">{r.effectiveDate} — {r.currency} {Number(r.basicSalary ?? 0).toLocaleString()} basic</div>
              <div className="text-xs text-gray-500 space-x-3">
                {r.housingAllowance && <span>Housing: {Number(r.housingAllowance).toLocaleString()}</span>}
                {r.transportAllowance && <span>Transport: {Number(r.transportAllowance).toLocaleString()}</span>}
                {r.otherAllowances && <span>Other: {Number(r.otherAllowances).toLocaleString()}</span>}
              </div>
              {r.bankName && <div className="text-xs text-gray-400">{r.bankName} · {r.bankIban} · {r.paymentMethod?.replace("_", " ")}</div>}
            </div>
            <button onClick={() => del(r.id)} className="text-xs text-red-400 hover:text-red-600 ml-4 flex-shrink-0">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Timesheets Tab ───────────────────────────────────────────────────────────

function TimesheetsTab({ uuid }: { uuid: string }) {
  const [rows, setRows] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Timesheet>>({ hoursRegular: "8.00", hoursOvertime: "0.00", status: "draft" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Timesheet[]>(`/employees/${uuid}/timesheets`)
      .then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [uuid]);

  async function save() {
    setSaving(true);
    try {
      const row = await api.post<Timesheet>(`/employees/${uuid}/timesheets`, form);
      setRows((r) => [row, ...r]);
      setAdding(false);
      setForm({ hoursRegular: "8.00", hoursOvertime: "0.00", status: "draft" });
    } finally { setSaving(false); }
  }

  async function updateStatus(id: number, status: Timesheet["status"]) {
    const row = await api.patch<Timesheet>(`/employees/${uuid}/timesheets/${id}`, { status });
    setRows((r) => r.map((x) => (x.id === id ? row : x)));
  }

  async function del(id: number) {
    await api.delete(`/employees/${uuid}/timesheets/${id}`);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (loading) return <LoadingRows />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Timesheets</h3>
        <button onClick={() => setAdding(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ backgroundColor: "#c9a84c" }}>+ Log Day</button>
      </div>

      {adding && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <MiniField label="Work Date *" type="date" value={form.workDate} onChange={(v) => setForm((f) => ({ ...f, workDate: v }))} />
            <MiniField label="Regular Hrs" type="number" value={form.hoursRegular} onChange={(v) => setForm((f) => ({ ...f, hoursRegular: v }))} />
            <MiniField label="Overtime Hrs" type="number" value={form.hoursOvertime} onChange={(v) => setForm((f) => ({ ...f, hoursOvertime: v }))} />
            <MiniField label="Site Location" value={form.siteLocation} onChange={(v) => setForm((f) => ({ ...f, siteLocation: v }))} />
            <MiniField label="Project Code" value={form.projectCode} onChange={(v) => setForm((f) => ({ ...f, projectCode: v }))} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Timesheet["status"] }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <MiniField label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
            <button onClick={save} disabled={saving || !form.workDate} className="text-xs px-3 py-1.5 rounded text-white font-medium disabled:opacity-50" style={{ backgroundColor: "#c9a84c" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !adding && <EmptyState label="No timesheet entries yet." />}
      <div className="overflow-x-auto">
        {rows.length > 0 && (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-left">
              <th className="pb-2 text-xs font-semibold text-gray-400 uppercase">Date</th>
              <th className="pb-2 text-xs font-semibold text-gray-400 uppercase">Regular</th>
              <th className="pb-2 text-xs font-semibold text-gray-400 uppercase">OT</th>
              <th className="pb-2 text-xs font-semibold text-gray-400 uppercase">Site</th>
              <th className="pb-2 text-xs font-semibold text-gray-400 uppercase">Project</th>
              <th className="pb-2 text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="pb-2"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.id} className="py-2">
                  <td className="py-2 font-mono text-xs">{r.workDate}</td>
                  <td className="py-2">{r.hoursRegular}h</td>
                  <td className="py-2">{r.hoursOvertime}h</td>
                  <td className="py-2 text-gray-500">{r.siteLocation ?? "—"}</td>
                  <td className="py-2 text-gray-500">{r.projectCode ?? "—"}</td>
                  <td className="py-2">
                    <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value as Timesheet["status"])}
                      className="border border-gray-200 rounded px-1.5 py-0.5 text-xs">
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="py-2 text-right"><button onClick={() => del(r.id)} className="text-xs text-red-400 hover:text-red-600">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Leave Tab ────────────────────────────────────────────────────────────────

function LeaveTab({ uuid }: { uuid: string }) {
  const [rows, setRows] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Leave>>({ leaveType: "annual", status: "pending", days: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Leave[]>(`/employees/${uuid}/leave`)
      .then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [uuid]);

  async function save() {
    setSaving(true);
    try {
      const row = await api.post<Leave>(`/employees/${uuid}/leave`, form);
      setRows((r) => [row, ...r]);
      setAdding(false);
      setForm({ leaveType: "annual", status: "pending", days: 1 });
    } finally { setSaving(false); }
  }

  async function updateStatus(id: number, status: Leave["status"]) {
    const row = await api.patch<Leave>(`/employees/${uuid}/leave/${id}`, { status });
    setRows((r) => r.map((x) => (x.id === id ? row : x)));
  }

  async function del(id: number) {
    await api.delete(`/employees/${uuid}/leave/${id}`);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (loading) return <LoadingRows />;

  const leaveTypes = ["annual", "sick", "emergency", "unpaid", "maternity", "hajj", "other"];
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Leave Records</h3>
        <button onClick={() => setAdding(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ backgroundColor: "#c9a84c" }}>+ Request Leave</button>
      </div>

      {adding && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Leave Type *</label>
              <select value={form.leaveType} onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value as Leave["leaveType"] }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                {leaveTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <MiniField label="Start Date *" type="date" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            <MiniField label="End Date *" type="date" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} />
            <MiniField label="Days" type="number" value={String(form.days ?? "")} onChange={(v) => setForm((f) => ({ ...f, days: Number(v) }))} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Leave["status"] }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <MiniField label="Reason" value={form.reason} onChange={(v) => setForm((f) => ({ ...f, reason: v }))} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
            <button onClick={save} disabled={saving || !form.startDate || !form.endDate} className="text-xs px-3 py-1.5 rounded text-white font-medium disabled:opacity-50" style={{ backgroundColor: "#c9a84c" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !adding && <EmptyState label="No leave records yet." />}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 capitalize">{r.leaveType}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[r.status]}`}>{r.status}</span>
              </div>
              <div className="text-xs text-gray-500">{r.startDate} → {r.endDate} · {r.days} day{r.days !== 1 ? "s" : ""}</div>
              {r.reason && <div className="text-xs text-gray-400">{r.reason}</div>}
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value as Leave["status"])}
                className="border border-gray-200 rounded px-1.5 py-0.5 text-xs">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={() => del(r.id)} className="text-xs text-red-400 hover:text-red-600">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Functions Tab ────────────────────────────────────────────────────────────

function FunctionsTab({ uuid }: { uuid: string }) {
  const [rows, setRows] = useState<EmployeeFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<EmployeeFunction>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<EmployeeFunction[]>(`/employees/${uuid}/functions`)
      .then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [uuid]);

  async function save() {
    setSaving(true);
    try {
      const row = await api.post<EmployeeFunction>(`/employees/${uuid}/functions`, form);
      setRows((r) => [...r, row]);
      setAdding(false);
      setForm({});
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    await api.delete(`/employees/${uuid}/functions/${id}`);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (loading) return <LoadingRows />;

  const levelLabels = ["", "Trainee", "Junior", "Competent", "Senior", "Expert / Assessor"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Functions & Competencies</h3>
        <button onClick={() => setAdding(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ backgroundColor: "#c9a84c" }}>+ Add Function</button>
      </div>

      {adding && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MiniField label="Function Title *" value={form.functionTitle} onChange={(v) => setForm((f) => ({ ...f, functionTitle: v }))} />
            <MiniField label="Function Code" value={form.functionCode} onChange={(v) => setForm((f) => ({ ...f, functionCode: v }))} />
            <div className="col-span-2"><MiniField label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} /></div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Competency Level</label>
              <select value={form.competencyLevel ?? ""} onChange={(e) => setForm((f) => ({ ...f, competencyLevel: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <option value="">— select —</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} — {levelLabels[n]}</option>)}
              </select>
            </div>
            <MiniField label="Certified Date" type="date" value={form.certifiedDate} onChange={(v) => setForm((f) => ({ ...f, certifiedDate: v }))} />
            <MiniField label="Expiry Date" type="date" value={form.expiryDate} onChange={(v) => setForm((f) => ({ ...f, expiryDate: v }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
            <button onClick={save} disabled={saving || !form.functionTitle} className="text-xs px-3 py-1.5 rounded text-white font-medium disabled:opacity-50" style={{ backgroundColor: "#c9a84c" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !adding && <EmptyState label="No functions assigned yet." />}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{r.functionTitle}</span>
                {r.functionCode && <span className="text-xs font-mono text-gray-400">{r.functionCode}</span>}
                {r.competencyLevel && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    L{r.competencyLevel} — {levelLabels[r.competencyLevel]}
                  </span>
                )}
              </div>
              {r.description && <div className="text-xs text-gray-500">{r.description}</div>}
              <div className="text-xs text-gray-400 space-x-3">
                {r.certifiedDate && <span>Certified: {r.certifiedDate}</span>}
                {r.expiryDate && <span>Expires: {r.expiryDate}</span>}
              </div>
            </div>
            <button onClick={() => del(r.id)} className="text-xs text-red-400 hover:text-red-600 ml-4 flex-shrink-0">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Training Tab ─────────────────────────────────────────────────────────────

function TrainingTab({ uuid }: { uuid: string }) {
  const [rows, setRows] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<Training>>({ status: "completed" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Training[]>(`/employees/${uuid}/training`)
      .then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [uuid]);

  async function save() {
    setSaving(true);
    try {
      const row = await api.post<Training>(`/employees/${uuid}/training`, form);
      setRows((r) => [row, ...r]);
      setAdding(false);
      setForm({ status: "completed" });
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    await api.delete(`/employees/${uuid}/training/${id}`);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  if (loading) return <LoadingRows />;

  const statusColors: Record<string, string> = {
    completed: "bg-green-50 text-green-700",
    in_progress: "bg-blue-50 text-blue-700",
    expired: "bg-red-50 text-red-600",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Training & Certifications</h3>
        <button onClick={() => setAdding(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ backgroundColor: "#c9a84c" }}>+ Add Training</button>
      </div>

      {adding && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MiniField label="Course Name *" value={form.courseName} onChange={(v) => setForm((f) => ({ ...f, courseName: v }))} />
            <MiniField label="Provider" value={form.provider} onChange={(v) => setForm((f) => ({ ...f, provider: v }))} />
            <MiniField label="Completion Date" type="date" value={form.completionDate} onChange={(v) => setForm((f) => ({ ...f, completionDate: v }))} />
            <MiniField label="Expiry Date" type="date" value={form.expiryDate} onChange={(v) => setForm((f) => ({ ...f, expiryDate: v }))} />
            <MiniField label="Certificate URL" value={form.certificateUrl} onChange={(v) => setForm((f) => ({ ...f, certificateUrl: v }))} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Training["status"] }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <MiniField label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
            <button onClick={save} disabled={saving || !form.courseName} className="text-xs px-3 py-1.5 rounded text-white font-medium disabled:opacity-50" style={{ backgroundColor: "#c9a84c" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !adding && <EmptyState label="No training records yet." />}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{r.courseName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                  {r.status.replace("_", " ")}
                </span>
              </div>
              {r.provider && <div className="text-xs text-gray-500">{r.provider}</div>}
              <div className="text-xs text-gray-400 space-x-3">
                {r.completionDate && <span>Completed: {r.completionDate}</span>}
                {r.expiryDate && <span>Expires: {r.expiryDate}</span>}
              </div>
              {r.certificateUrl && (
                <a href={r.certificateUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">View Certificate →</a>
              )}
            </div>
            <button onClick={() => del(r.id)} className="text-xs text-red-400 hover:text-red-600 ml-4 flex-shrink-0">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = "text", placeholder, className }: {
  label: string; value?: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
    </div>
  );
}

function DateWithBadge({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 flex-1" />
        <ExpiryBadge dateStr={value} />
      </div>
    </div>
  );
}

function MiniField({ label, value, onChange, type = "text", placeholder }: {
  label: string; value?: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
    </div>
  );
}

function LoadingRows() {
  return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="text-center py-10 text-sm text-gray-400">{label}</div>;
}
