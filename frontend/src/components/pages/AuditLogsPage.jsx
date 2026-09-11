import React, { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, RefreshCw, Clock } from "lucide-react";

const ACTION_LABELS = {
  login: "🔑 Login",
  register: "👤 Register",
  chat_create: "💬 Chat Created",
  password_change: "🔒 Password Change",
  user_status_change: "⚡ Status Change",
  user_create: "➕ User Created",
  user_delete: "🗑️ User Deleted",
};

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

function relTime(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Audit Logs page — live stream of security & operational events
 * (login, user changes, chat creation, password changes, telemetry).
 */
export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/audit-logs?limit=100");
      if (res.ok) { setLogs(await res.json()); setError(""); return; }
      setError("Unable to load audit logs.");
    } catch {
      setError("Unable to reach the backend service.");
    }
  }, []);

  useEffect(() => {
    loadLogs();
    const iv = setInterval(loadLogs, 10000);
    return () => clearInterval(iv);
  }, [loadLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const filtered = logs.filter(
    (log) =>
      (actionFilter === "all" || log.action === actionFilter) &&
      (log.details || "").toLowerCase().includes(search.toLowerCase())
  );

  const actions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Audit Logs</h1>
          <p className="text-xs text-slate-500">Live security &amp; operational event stream · auto-refreshes every 10s</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <ClipboardList size={13} className="text-red-600 shrink-0" />
          <p className="text-[11px] text-red-700">{error}</p>
        </div>
      )}
{/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event details…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActionFilter("all")}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
              actionFilter === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(actionFilter === a ? "all" : a)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                actionFilter === a
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {ACTION_LABELS[a] || a}
            </button>
          ))}
        </div>
      </div>

      {/* Log stream */}
      {filtered.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-10 text-center">
          <p className="text-xs text-slate-400">No audit events recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg divide-y divide-slate-100 overflow-hidden">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-slate-50/70 transition-colors">
              <span className="text-base shrink-0 mt-0.5">{ACTION_LABELS[log.action]?.split(" ")[0] || "📋"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 leading-snug">{log.details}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  <span className="uppercase font-bold text-slate-500">{log.action}</span> · by {log.userId}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                  <Clock size={10} /> {relTime(log.timestamp)}
                </p>
                <p className="text-[9px] text-slate-300" title={fmtTime(log.timestamp)}>{fmtTime(log.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}