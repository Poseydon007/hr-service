import { useEffect, useState } from "react";
import { api, type Employee, type ExpiringDoc, type ApiError } from "../lib/api.ts";

interface Stats {
  total: number;
  active: number;
  departments: number;
  expiringSoon: number;
}

function daysLeft(dateStr: string): number {
  const expiry = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function rowColor(days: number): string {
  if (days < 30) return "bg-red-50";
  if (days < 60) return "bg-orange-50";
  return "";
}

function daysColor(days: number): string {
  if (days < 30) return "text-red-700 font-semibold";
  if (days < 60) return "text-orange-600 font-semibold";
  return "text-gray-600";
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [expiring, setExpiring] = useState<ExpiringDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [employees, expiringDocs] = await Promise.all([
          api.get<Employee[]>("/employees?status=active"),
          api.get<ExpiringDoc[]>("/employees/meta/expiring?days=60"),
        ]);
        if (cancelled) return;

        const allEmployees = await api.get<Employee[]>("/employees");
        if (cancelled) return;

        const depts = new Set(allEmployees.map((e) => e.department).filter(Boolean));
        setStats({
          total: allEmployees.length,
          active: employees.length,
          departments: depts.size,
          expiringSoon: expiringDocs.length,
        });
        setExpiring(expiringDocs);
      } catch (err) {
        if (!cancelled) setError((err as ApiError).message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Employees" value={stats?.total ?? 0} color="navy" />
        <StatCard label="Active" value={stats?.active ?? 0} color="green" />
        <StatCard label="Departments" value={stats?.departments ?? 0} color="blue" />
        <StatCard
          label="Expiring Soon"
          value={stats?.expiringSoon ?? 0}
          color={stats && stats.expiringSoon > 0 ? "orange" : "gray"}
        />
      </div>

      {/* Expiry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Document Expiry Alerts
          </h2>
          <span className="text-xs text-gray-400">(next 60 days)</span>
        </div>

        {expiring.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No documents expiring in the next 60 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dept</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Doc Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expiring.map((doc, i) => {
                  const days = daysLeft(doc.expiryDate);
                  return (
                    <tr key={i} className={rowColor(days)}>
                      <td className="px-4 py-3 font-medium text-gray-800">{doc.fullName}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.department ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{doc.docType}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(doc.expiryDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className={`px-4 py-3 ${daysColor(days)}`}>{days}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "navy" | "green" | "blue" | "orange" | "gray";
}) {
  const accent: Record<typeof color, string> = {
    navy: "text-[#0f2044]",
    green: "text-green-600",
    blue: "text-blue-600",
    orange: "text-orange-500",
    gray: "text-gray-500",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-5">
      <div className={`text-3xl font-bold ${accent[color]}`}>{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-24" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 h-48" />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      Failed to load dashboard: {message}
    </div>
  );
}
