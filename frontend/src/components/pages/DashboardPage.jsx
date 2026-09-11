import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Activity, MessageSquare, Cpu, HardDrive, Zap, Gauge,
  ShieldCheck, UserCheck, Lock, ArrowRight, Bot, RefreshCw, ClipboardList,
} from "lucide-react";

const ROLE_LABELS = {
  "control-room": "Control Room",
  "safety-officer": "SHE Officer",
  "field-technician": "Field Tech",
  "plant-admin": "Plant Admin",
};

const LOG_ICONS = {
  login: "🔑", register: "👤", chat_create: "💬", password_change: "🔒",
  user_status_change: "⚡", user_create: "➕", user_delete: "🗑️",
};

function relTime(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtUptime(secs) {
  if (!secs) return "0s";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Dashboard page — executive summaries aggregating data from the other
 * primary pages: user counts (User Management), system health (telemetry),
 * recent audit activity (Audit Logs) and chat activity (Chatbot).
 */
export default function DashboardPage({ currentRole, onNavigate, onStartChat }) {
  const [users, setUsers] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [adminLock, setAdminLock] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [uRes, tRes, lRes, cRes] = await Promise.all([
        fetch("/api/users", { headers }),
        fetch("/api/telemetry"),
        fetch("/api/audit-logs?limit=10"),
        fetch("/api/chats", { headers }),
      ]);
      if (uRes.ok) {
        setUsers(await uRes.json());
        setAdminLock(false);
      } else if (uRes.status === 403) {
        setAdminLock(true);
        setUsers([]);
      } else {
        setUsers([]);
      }
      if (tRes.ok) setTelemetry(await tRes.json());
      if (lRes.ok) setLogs(await lRes.json());
      if (cRes.ok) setSessions(await cRes.json());
    } catch {
      setUsers((prev) => (prev === null ? [] : prev));
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalUsers = users?.length ?? 0;
  const activeUsers = (users || []).filter((u) => u.status === "active").length;
  const disabledUsers = totalUsers - activeUsers;
  const totalTokens = (users || []).reduce((s, u) => s + Number(u.tokenUsageCount || 0), 0);
  const totalScreenHrs = ((users || []).reduce((s, u) => s + Number(u.screenTimeMinutes || 0), 0) / 60).toFixed(1);
  const healthStatus = !telemetry || !telemetry.node_health
    ? "Loading"
    : telemetry.node_health.every((n) => n.status === "healthy")
    ? "Healthy"
    : "Degraded";
  const roleCounts = (users || []).reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const kpiCards = [
    {
      icon: <Users size={16} />,
      label: "Total Users",
      value: adminLock ? "—" : totalUsers,
      sub: adminLock ? "Admin view locked" : `${activeUsers} active · ${disabledUsers} disabled`,
      color: "text-blue-600 bg-blue-50",
      onClick: () => onNavigate("user-management"),
    },
    {
      icon: <MessageSquare size={16} />,
      label: "Chat Sessions",
      value: sessions.length,
      sub: sessions.length ? `Last: ${relTime(sessions[0]?.updatedAt)}` : "No sessions yet",
      color: "text-purple-600 bg-purple-50",
      onClick: onStartChat,
    },
    {
      icon: <ShieldCheck size={16} />,
      label: "System Health",
      value: healthStatus,
      sub: telemetry ? `${telemetry.model_loaded || "Model"} · ${fmtUptime(telemetry.uptime_seconds)}` : "Waiting for telemetry…",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: <Zap size={16} />,
      label: "Token Usage",
      value: totalTokens.toLocaleString(),
      sub: `${totalScreenHrs}h total screen time`,
      color: "text-amber-600 bg-amber-50",
      onClick: () => onNavigate("user-management"),
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Executive Summary</h1>
          <p className="text-xs text-slate-500">
            {currentRole.icon} {currentRole.name} · Live aggregation across User Management, Audits, Chatbot &amp; System Health
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map((k) => (
          <button
            key={k.label}
            onClick={k.onClick}
            disabled={!k.onClick}
            className={`bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4 text-left transition-all ${
              k.onClick ? "hover:border-blue-400 hover:shadow-md group" : "cursor-default"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`flex items-center justify-center w-8 h-8 rounded-xl ${k.color}`}>{k.icon}</span>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{k.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              {k.sub}
              {k.onClick && <ArrowRight size={11} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </p>
          </button>
        ))}
      </div>

      {adminLock && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Lock size={13} className="text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-700">
            User statistics require Plant Admin privileges. Other summaries remain available.
          </p>
        </div>
      )}
<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* System Health */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={15} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">System Health</h3>
            <span className="ml-auto flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${healthStatus === "Healthy" ? "bg-emerald-500 animate-pulse" : healthStatus === "Degraded" ? "bg-amber-500 animate-pulse" : "bg-slate-300"}`} />
              <span className={`text-[10px] font-bold uppercase ${healthStatus === "Healthy" ? "text-emerald-600" : healthStatus === "Degraded" ? "text-amber-600" : "text-slate-400"}`}>{healthStatus}</span>
            </span>
          </div>

          {!telemetry ? (
            <p className="text-xs text-slate-400 text-center py-8">Loading live telemetry…</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold mb-1 flex items-center justify-center gap-1"><Cpu size={11} className="text-blue-500" />CPU</p>
                  <p className="text-lg font-bold text-slate-900">{telemetry.cpu_percent}%</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold mb-1 flex items-center justify-center gap-1"><HardDrive size={11} className="text-emerald-500" />RAM</p>
                  <p className="text-lg font-bold text-slate-900">{telemetry.ram_percent}%</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold mb-1 flex items-center justify-center gap-1"><Gauge size={11} className="text-amber-500" />GPU Util</p>
                  <p className="text-lg font-bold text-slate-900">{telemetry.gpu_utilization}%</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold mb-1 flex items-center justify-center gap-1"><Zap size={11} className="text-purple-500" />Tokens/s</p>
                  <p className="text-lg font-bold text-slate-900">{telemetry.tokens_per_second}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-600 mb-1">VRAM Usage</p>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(telemetry.vram_percent, 100)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{telemetry.vram_used_gb} / {telemetry.vram_total_gb} GB · {telemetry.vram_percent}%</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(telemetry.node_health || []).map((n) => (
                  <div key={n.id || n.name} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className={`h-2 w-2 rounded-full ${n.status === "healthy" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                    <p className="text-[10px] font-semibold text-slate-700">{n.name}</p>
                    <p className="text-[9px] text-slate-400">{n.uptime}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
<div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={15} className="text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Chat Activity</h3>
            <button
              onClick={onStartChat}
              className="ml-auto flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors"
            >
              Open Chatbot <ArrowRight size={11} />
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No chat sessions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 shrink-0">
                    <MessageSquare size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 truncate">{s.sessionTitle || "Untitled chat"}</p>
                    <p className="text-[10px] text-slate-400">{ROLE_LABELS[s.role] || s.role} · {s.messages?.length || 0} msgs · {relTime(s.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {sessions.length > 6 && (
            <button
              onClick={onStartChat}
              className="mt-2 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
            >
              + {sessions.length - 6} more session{sessions.length - 6 > 1 ? "s" : ""} in chatbot history
            </button>
          )}
        </div>
<div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={15} className="text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Audit Activity</h3>
            <button
              onClick={() => onNavigate("audit-logs")}
              className="ml-auto flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors"
            >
              View All <ArrowRight size={11} />
            </button>
          </div>

          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No audit events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-sm shrink-0">{LOG_ICONS[log.action] || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 leading-snug">{log.details}</p>
                    <p className="text-[10px] text-slate-400">{log.action} · by {log.userId}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{relTime(log.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Role Distribution */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={15} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">User Role Distribution</h3>
            <button
              onClick={() => onNavigate("user-management")}
              className="ml-auto flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors"
            >
              Manage Users <ArrowRight size={11} />
            </button>
          </div>

          {users === null ? (
            <p className="text-xs text-slate-400 text-center py-8">Loading users…</p>
          ) : users.length === 0 && adminLock ? (
            <p className="text-xs text-slate-400 text-center py-8">Available to Plant Administrators only.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.keys(ROLE_LABELS).map((roleId) => {
                const count = roleCounts[roleId] || 0;
                const pct = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
                const barColor = {
                  "control-room": "bg-blue-500",
                  "safety-officer": "bg-red-500",
                  "field-technician": "bg-amber-500",
                  "plant-admin": "bg-emerald-500",
                }[roleId];
                return (
                  <div key={roleId}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700">{ROLE_LABELS[roleId]}</span>
                      <span className="text-slate-400">{count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400">
                <Activity size={11} />
                <span>User telemetry refreshed every 15s · Auto-synced with User Management</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
        <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
        <p className="text-[10px] text-emerald-700">
          100% air-gapped · All summary data sourced from on-premise MRPL services · No external network calls
        </p>
      </div>
    </div>
  );
}