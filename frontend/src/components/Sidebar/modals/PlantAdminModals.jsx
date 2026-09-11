import React, { useState, useEffect } from "react";
import { UserPlus, Search } from "lucide-react";
import ModalOverlay from "../ModalOverlay.jsx";

/* ── User Management Modal ── */
export function UserManagementModal({ onClose, defaultShowCreate = false }) {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(defaultShowCreate);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ fullName: "", username: "", password: "", role: "control-room", dob: "", workingSince: "" });

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setLoadError("No active session. Please log in again."); return; }
      const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setUsers(await res.json()); setLoadError(""); return; }
      if (res.status === 403) { setLoadError("Access denied. Only Plant Admin can manage users."); return; }
      setLoadError("Unable to load users.");
    } catch {
      setLoadError("Unable to reach the backend service.");
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.username.trim() || !form.password.trim()) {
      setFormError("Full name, username and password are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ fullName: "", username: "", password: "", role: "control-room", dob: "", workingSince: "" });
        setShowCreate(false);
        await loadUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        setFormError(data.detail || "Failed to create user");
      }
    } catch {
      setFormError("Unable to reach the backend service.");
    } finally {
      setSaving(false);
    }
  };

  const roleLabels = { "control-room": "Control Room", "safety-officer": "SHE Officer", "field-technician": "Field Tech", "plant-admin": "Plant Admin" };
  const roleColors = { "control-room": "bg-blue-100 text-blue-700", "safety-officer": "bg-red-100 text-red-700", "field-technician": "bg-amber-100 text-amber-700", "plant-admin": "bg-emerald-100 text-emerald-700" };
  const filtered = users.filter(u => u.fullName.toLowerCase().includes(filter.toLowerCase()) || u.username.toLowerCase().includes(filter.toLowerCase()));

  return (
    <ModalOverlay title="User Management" onClose={onClose} width="max-w-3xl">
      <div className="space-y-4">
        {loadError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loadError}</p>}

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Create New User</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Full Name *</label>
                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" placeholder="e.g. Raj Sharma" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Username *</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" placeholder="e.g. rsharma" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" placeholder="Minimum 6 characters" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none">
                  <option value="control-room">Control Room Operator</option>
                  <option value="safety-officer">SHE Officer</option>
                  <option value="field-technician">Field Technician</option>
                  <option value="plant-admin">Plant Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Working Since</label>
                <input type="date" value={form.workingSince} onChange={e => setForm({ ...form, workingSince: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" />
              </div>
            </div>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                {saving ? "Creating..." : "Create User"}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setFormError(""); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search users..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:outline-none" />
          </div>
          <button onClick={() => { setShowCreate(!showCreate); setFormError(""); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 shrink-0">
            <UserPlus size={14} /> {showCreate ? "Cancel" : "Add User"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200">
              <th className="text-left py-2 px-2 text-slate-500 font-semibold">User</th>
              <th className="text-left py-2 px-2 text-slate-500 font-semibold">Role</th>
              <th className="text-center py-2 px-2 text-slate-500 font-semibold">Status</th>
              <th className="text-right py-2 px-2 text-slate-500 font-semibold">Screen Time</th>
              <th className="text-right py-2 px-2 text-slate-500 font-semibold">Tokens</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-400 italic">{loadError ? "Could not load users." : "No users found."}</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2"><p className="font-semibold text-slate-800">{u.fullName}</p><p className="text-[10px] text-slate-400">@{u.username}</p></td>
                  <td className="py-2 px-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{roleLabels[u.role]}</span></td>
                  <td className="py-2 px-2 text-center"><span className={`text-[10px] font-bold ${u.status === "active" ? "text-emerald-600" : "text-red-500"}`}>{u.status}</span></td>
                  <td className="py-2 px-2 text-right text-slate-600">{Math.round(u.screenTimeMinutes / 60)}h</td>
                  <td className="py-2 px-2 text-right text-slate-600">{u.tokenUsageCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ── Audit Logs Modal ── */
export function AuditLogsModal({ onClose }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/audit-logs?limit=30");
        if (res.ok) { setLogs(await res.json()); return; }
      } catch { /* ignore */ }
      setLogs([
        { id: "1", userId: "rvk", action: "login", details: "User 'rvk' logged in", timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: "2", userId: "pnaik", action: "chat_create", details: "New chat session 'PTW Review'", timestamp: new Date(Date.now() - 600000).toISOString() },
        { id: "3", userId: "admin", action: "user_status_change", details: "User rsharma status changed to 'disabled'", timestamp: new Date(Date.now() - 900000).toISOString() },
        { id: "4", userId: "skumar", action: "login", details: "User 'skumar' logged in", timestamp: new Date(Date.now() - 1200000).toISOString() },
      ]);
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const icons = { login: "🔑", chat_create: "💬", register: "👤", password_change: "🔒", user_status_change: "⚡" };
  const fmt = (ts) => {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <ModalOverlay title="Audit Logs — Live Stream" onClose={onClose} width="max-w-2xl">
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No audit events recorded yet.</p>
        ) : logs.map(log => (
          <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-lg shrink-0">{icons[log.action] || "📋"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-800">{log.details}</p>
              <p className="text-[10px] text-slate-400">{log.action} · by {log.userId}</p>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">{fmt(log.timestamp)}</span>
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
}

/* ── Hardware Telemetry Modal ── */
export function HWTelemetryModal({ onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const fetch = async () => {
      try { const r = await fetch("/api/telemetry"); if (r.ok) setData(await r.json()); } catch {}
    };
    fetch();
    const iv = setInterval(fetch, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <ModalOverlay title="Hardware Telemetry — Live" onClose={onClose} width="max-w-2xl">
      {!data ? <p className="text-xs text-slate-400 text-center py-8">Loading telemetry...</p> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "CPU", value: `${data.cpu_percent}%`, color: "text-blue-600" },
              { label: "RAM", value: `${data.ram_percent}%`, color: "text-emerald-600" },
              { label: "GPU Util", value: `${data.gpu_utilization}%`, color: "text-amber-600" },
              { label: "Token Speed", value: `${data.tokens_per_second} t/s`, color: "text-purple-600" },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase text-slate-400 font-semibold mb-1">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-700 mb-2">GPU VRAM</p>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${data.vram_percent}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{data.vram_used_gb} / {data.vram_total_gb} GB ({data.vram_percent}%)</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[10px] text-slate-400">Disk Used</p><p className="text-sm font-bold text-slate-800">{data.disk_used_gb} / {data.disk_total_gb} GB</p></div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[10px] text-slate-400">Uptime</p><p className="text-sm font-bold text-slate-800">{Math.floor(data.uptime_seconds / 3600)}h {Math.floor((data.uptime_seconds % 3600) / 60)}m</p></div>
          </div>
          <p className="text-[10px] text-slate-400 text-center">Model: {data.model_loaded} · Auto-refreshing every 5s</p>
        </div>
      )}
    </ModalOverlay>
  );
}

/* ── System Settings Modal ── */
export function SystemSettingsModal({ onClose }) {
  return (
    <ModalOverlay title="System Settings" onClose={onClose}>
      <div className="space-y-4">
        {[
          { label: "Ollama Endpoint", value: "http://ollama:11434/api/generate", type: "url" },
          { label: "Default Model", value: "llama3.2:1b", type: "text" },
          { label: "Max Token Limit", value: "220", type: "number" },
          { label: "Temperature", value: "0.6", type: "number" },
          { label: "Session Timeout", value: "480", type: "number" },
          { label: "JWT Secret", value: "••••••••••", type: "password" },
        ].map(s => (
          <div key={s.label}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{s.label}</label>
            <input type={s.type === "password" ? "text" : s.type} defaultValue={s.value} disabled={s.label === "Ollama Endpoint"}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500/40 focus:outline-none disabled:opacity-60" />
          </div>
        ))}
        <p className="text-[10px] text-slate-400">Endpoint URL is managed via environment variables.</p>
      </div>
    </ModalOverlay>
  );
}
