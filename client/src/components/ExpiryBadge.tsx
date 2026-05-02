interface Props {
  dateStr?: string;
}

function daysUntil(dateStr: string): number {
  const expiry = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ExpiryBadge({ dateStr }: Props) {
  if (!dateStr) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const days = daysUntil(dateStr);
  const formatted = new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let badgeClass = "bg-green-100 text-green-800";
  let label = `${days}d`;

  if (days < 0) {
    badgeClass = "bg-red-200 text-red-900";
    label = "Expired";
  } else if (days < 30) {
    badgeClass = "bg-red-100 text-red-700";
    label = `${days}d`;
  } else if (days < 60) {
    badgeClass = "bg-orange-100 text-orange-700";
    label = `${days}d`;
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-sm text-gray-700">{formatted}</span>
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badgeClass}`}>
        {label}
      </span>
    </span>
  );
}
