import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Dashboard", icon: "⊞" },
  { to: "/employees", label: "Employees", icon: "👥" },
  { to: "/keys", label: "API Keys", icon: "🔑" },
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
          {navLinks.map(({ to, label, icon }) => (
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
              <span className="text-base">{icon}</span>
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
