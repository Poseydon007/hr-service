import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Please paste your admin API key.");
      return;
    }
    sessionStorage.setItem("hr_admin_key", trimmed);
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div
            className="px-8 py-8 text-center"
            style={{ backgroundColor: "#0f2044" }}
          >
            <h1 className="text-2xl font-bold text-white tracking-wide">
              True East HR
            </h1>
            <p className="mt-1 text-sm font-medium" style={{ color: "#c9a84c" }}>
              Admin Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label
                htmlFor="apikey"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Admin API Key
              </label>
              <textarea
                id="apikey"
                rows={4}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError("");
                }}
                placeholder="Paste your admin API key here…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                style={{ "--tw-ring-color": "#c9a84c" } as React.CSSProperties}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow = "0 0 0 2px #c9a84c")
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
                autoComplete="off"
                spellCheck={false}
              />
              {error && (
                <p className="mt-1.5 text-xs text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
              style={{ backgroundColor: "#c9a84c" }}
            >
              Enter
            </button>

            <p className="text-center text-xs text-gray-400">
              Key is stored in session only and cleared on tab close.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
