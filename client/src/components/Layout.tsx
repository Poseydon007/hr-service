import { NavLink, Outlet, useNavigate } from "react-router-dom";

const icons: Record<string, JSX.Element> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  employees: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a5 5 0 0 1 5-5h2" />
      <circle cx="17" cy="11" r="3" />
      <path d="M13 21v-2a4 4 0 0 1 8 0v2" />
    </svg>
  ),
  keys: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="8" cy="15" r="4" />
      <path d="M12 11l8-8" />
      <path d="M17 3l3 3" />
      <path d="M19 7l2-2" />
    </svg>
  ),
};

const navLinks = [
  { to: "/", label: "Dashboard", iconKey: "dashboard" },
  { to: "/employees", label: "Employees", iconKey: "employees" },
  { to: "/keys", label: "API Keys", iconKey: "keys" },
];

export default function Layout() {
  const navigate = useNavigate();
  const rawKey = sessionStorage.getItem("hr_admin_key") ?? "";
  const keyPreview = rawKey
    ? `${rawKey.slice(0, 8)}...`
    : "No key";

  function handleLogout() {
    sessionStorage.removeItem("hr_admin_key");
    navigate("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-56 flex-shrink-0 text-white"
        style={{ backgroundColor: "#0f2044" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex flex-col items-center">
          <img src="/logo-white.png" alt="True East" className="w-28 opacity-95" />
          <div className="text-xs text-white/50 mt-2 tracking-widest uppercase">
            HR Portal
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, iconKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {icons[iconKey]}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shadow-sm flex-shrink-0"
        >
          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            True East HR Portal
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Admin Key:</span>
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
              {keyPreview}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
