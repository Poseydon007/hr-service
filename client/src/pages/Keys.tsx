import { useEffect, useState, FormEvent } from "react";
import { api, type ApiKey, type CreateKeyResponse } from "../lib/api.ts";

const ALL_SCOPES = ["read:profile", "read:internal", "read:sensitive", "write", "full"] as const;
type Scope = typeof ALL_SCOPES[number];

export default function Keys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New key form
  const [appName, setAppName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<Set<Scope>>(new Set());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Raw key modal
  const [newKey, setNewKey] = useState<CreateKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke confirm
  const [revokeId, setRevokeId] = useState<number | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  function loadKeys() {
    setLoading(true);
    api
      .get<ApiKey[]>("/admin/keys")
      .then((data) => setKeys(data))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }

  function toggleScope(scope: Scope) {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!appName.trim()) {
      setCreateError("App name is required.");
      return;
    }
    if (selectedScopes.size === 0) {
      setCreateError("Select at least one scope.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const created = await api.post<CreateKeyResponse>("/admin/keys", {
        appName: appName.trim(),
        scope: Array.from(selectedScopes),
      });
      setNewKey(created);
      setAppName("");
      setSelectedScopes(new Set());
      loadKeys();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: number) {
    try {
      await api.delete(`/admin/keys/${id}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRevokeId(null);
    }
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">API Keys</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Active Keys</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400 animate-pulse">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">App Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Prefix</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Used</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {keys.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No API keys yet.</td>
                  </tr>
                )}
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{k.appName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{k.prefix}…</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(k.scope) ? k.scope : [k.scope]).map((s) => (
                          <span key={s} className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${k.active ? "text-green-600" : "text-gray-400"}`}>
                        {k.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {k.lastUsed
                        ? new Date(k.lastUsed).toLocaleDateString("en-GB")
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRevokeId(k.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Key Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">+ New API Key</h2>
        </div>
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {createError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              App Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. HRIS Integration"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-64"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Scopes
            </label>
            <div className="flex flex-wrap gap-3">
              {ALL_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedScopes.has(scope)}
                    onChange={() => toggleScope(scope)}
                    className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                  />
                  <span className="text-sm text-gray-700">{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#c9a84c" }}
          >
            {creating ? "Generating…" : "Generate Key"}
          </button>
        </form>
      </div>

      {/* Raw Key Modal */}
      {newKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <h3 className="font-semibold text-gray-800">API Key Created</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 font-medium mb-2">
                This key will not be shown again. Copy it now.
              </p>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs text-gray-800 break-all">
                {newKey.rawKey}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={copyKey}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                {copied ? "Copied!" : "Copy Key"}
              </button>
              <button
                onClick={() => setNewKey(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: "#c9a84c" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirm modal */}
      {revokeId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Revoke Key?</h3>
            <p className="text-sm text-gray-600">
              This will permanently revoke the API key. Any service using it will lose access immediately.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRevokeId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevoke(revokeId)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
