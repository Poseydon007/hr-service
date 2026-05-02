import type { EmployeeStatus } from "../lib/api.ts";

const config: Record<EmployeeStatus, { label: string; classes: string }> = {
  active: {
    label: "Active",
    classes: "bg-green-100 text-green-800",
  },
  inactive: {
    label: "Inactive",
    classes: "bg-gray-100 text-gray-600",
  },
  on_leave: {
    label: "On Leave",
    classes: "bg-yellow-100 text-yellow-800",
  },
  terminated: {
    label: "Terminated",
    classes: "bg-red-100 text-red-700",
  },
};

interface Props {
  status: EmployeeStatus;
}

export default function StatusBadge({ status }: Props) {
  const cfg = config[status] ?? { label: status, classes: "bg-gray-100 text-gray-600" };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}
