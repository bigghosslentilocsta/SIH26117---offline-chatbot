import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Ban,
  CheckCircle2,
  Trash2,
  Loader2,
  Clock,
  Zap,
  ShieldAlert,
  X,
} from "lucide-react";
import ModalOverlay from "../Sidebar/ModalOverlay.jsx";
import Avatar from "../Avatar.jsx";

const ROLE_LABELS = {
  "control-room": "Control Room",
  "safety-officer": "SHE Officer",
  "field-technician": "Field Tech",
  "plant-admin": "Plant Admin",
};

const ROLE_BADGES = {
  "control-room": "bg-blue-100 text-blue-700",
  "safety-officer": "bg-red-100 text-red-700",
  "field-technician": "bg-amber-100 text-amber-700",
  "plant-admin": "bg-emerald-100 text-emerald-700",
};

function fmtMinutes(mins) {
  const n = Number(mins || 0);
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * User Management page — operational actions (create / delete / suspend)
 * plus per-user usage & telemetry columns (utilized tokens, active
 * screen time). Admin-only endpoints; the page surfaces backend 403s
 * gracefully for non-admin roles.
 */
export default function UserManagementPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "control-room",
    dob: "",
    workingSince: "",
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyStatus, setBusyStatus] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setLoadError("No active session. Please log in again."); return; }
      const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setUsers(await res.json()); setLoadError(""); return; }
      if (res.status === 403) { setLoadError("Access denied. Only Plant Admin can manage users."); setUsers([]); return; }
      setLoadError("Unable to load users.");
    } catch {
      setLoadError("Unable to reach the backend service.");
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.username.trim() || !form.password.trim()) {
      setFormError("Full name, username and password are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    setNotice("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setForm({ fullName: "", username: "", password: "", role: "control-room", dob: "", workingSince: "" });
        setShowCreate(false);
        setNotice(`User '${data.username}' created successfully.`);
        await loadUsers();
      } else {
        setFormError(data.detail || "Failed to create user");
      }
    } catch {
      setFormError("Unable to reach the backend service.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async (u) => {
    const next = u.status === "active" ? "disabled" : "active";
    setBusyStatus(`${u.id}:${next}`);
    setNotice("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users/${u.id}/status?status=${next}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotice(`User '${u.username}' ${next === "disabled" ? "suspended" : "activated"}.`);
        await loadUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        setNotice(data.detail || "Failed to update user status.");
      }
    } catch {
      setNotice("Unable to reach the backend service.");
    } finally {
      setBusyStatus("");
    }
  };

  const handleDelete = async (userId, username) => {
    setBusyStatus(`${userId}:delete`);
    setNotice("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setConfirmDelete(null);
        setNotice(`User '${username}' deleted.`);
        await loadUsers();
      } else {
        setConfirmDelete(null);
        setNotice(data.detail || "Failed to delete user.");
      }
    } catch {
      setConfirmDelete(null);
      setNotice("Unable to reach the backend service.");
    } finally {
      setBusyStatus("");
    }
  };

  const filtered = users.filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (u.fullName.toLowerCase().includes(filter.toLowerCase()) ||
        u.username.toLowerCase().includes(filter.toLowerCase()))
  );

  const totalTokens = users.reduce((s, u) => s + Number(u.tokenUsageCount || 0), 0);
  const activeCount = users.filter((u) => u.status === "active").length;
  const disabledCount = users.length - activeCount;
return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500">Create, suspend & delete operator accounts · usage telemetry per user</p>
        </div>
        <button
          onClick={() => { setFormError(""); setShowCreate(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-md"
        >
          <UserPlus size={14} /> Create User
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <ShieldAlert size={13} className="text-red-600 shrink-0" />
          <p className="text-[11px] text-red-700">{loadError}</p>
        </div>
      )}
      {notice && (
        <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <p className="text-[11px] text-emerald-700">{notice}</p>
          </div>
          <button onClick={() => setNotice("")} className="text-emerald-600 hover:text-emerald-800"><X size={13} /></button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { icon: <Users size={15} />, label: "Total Users", value: users.length, color: "bg-blue-50 text-blue-600" },
          { icon: <CheckCircle2 size={15} />, label: "Active", value: activeCount, color: "bg-emerald-50 text-emerald-600" },
          { icon: <Ban size={15} />, label: "Suspended", value: disabledCount, color: "bg-amber-50 text-amber-600" },
          { icon: <Zap size={15} />, label: "Total Tokens Used", value: totalTokens.toLocaleString(), color: "bg-purple-50 text-purple-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${c.color}`}>{c.icon}</span>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{c.label}</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or employee ID…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="all">All Roles</option>
          {Object.keys(ROLE_LABELS).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Users table */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[820px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">User</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Role</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Status</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Active Screen Time</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Tokens Used</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-slate-400 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-400">
                    {users.length === 0 ? "No users found." : "No users match your filters."}
                  </td>
                </tr>
              )}
{filtered.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={u} size={32} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {u.fullName}
                            {isSelf && <span className="ml-1.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5">You</span>}
                          </p>
                          <p className="text-[10px] text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGES[u.role] || "bg-slate-100 text-slate-700"}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-bold inline-flex items-center gap-1 ${u.status === "active" ? "text-emerald-600" : "text-red-500"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {u.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Clock size={12} className="text-slate-400" />
                        {fmtMinutes(u.screenTimeMinutes)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Zap size={12} className="text-amber-500" />
                        {Number(u.tokenUsageCount || 0).toLocaleString()}
                      </span>
                    </td>
<td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {confirmDelete === u.id ? (
                          <><button
                            onClick={() => handleDelete(u.id, u.username)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition-colors"
                          ><Trash2 size={11} /> Delete</button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold hover:bg-slate-200 transition-colors"
                          >Cancel</button></>
                        ) : (
                          <>{!isSelf && (
                            <button
                              onClick={() => toggleSuspend(u)}
                              disabled={busyStatus.startsWith(u.id)}
                              title={u.status === "active" ? "Suspend user" : "Reactivate user"}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 ${
                                u.status === "active"
                                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                            >
                              {busyStatus.startsWith(u.id) ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : u.status === "active" ? (
                                <Ban size={11} />
                              ) : (
                                <CheckCircle2 size={11} />
                              )}
                              {u.status === "active" ? "Suspend" : "Activate"}
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={isSelf}
                            title={isSelf ? "You cannot delete your own account" : "Delete user"}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          ><Trash2 size={11} /> Delete</button></>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
{/* Create user modal */}
      {showCreate && (
        <ModalOverlay title="Create New User" onClose={() => setShowCreate(false)} width="max-w-md">
          <form onSubmit={handleCreate} className="space-y-3">
            {formError && (
              <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="e.g. Rahul Verma"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Employee ID / Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="e.g. rverma"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temporary Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {Object.keys(ROLE_LABELS).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Working Since</label>
                <input
                  type="text"
                  value={form.workingSince}
                  onChange={(e) => setForm({ ...form, workingSince: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="e.g. 2019"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><UserPlus size={14} /> Create User</>}
            </button>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}