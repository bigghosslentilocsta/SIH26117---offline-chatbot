import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Settings as SettingsIcon,
  Clock3,
  Zap,
  UserCheck,
} from "lucide-react";
import Avatar from "../Avatar.jsx";
import PasswordChangeForm from "../PasswordChangeForm.jsx";

function fmtElapsed(startTs) {
  const secs = Math.floor((Date.now() - startTs) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Settings page — dedicated exclusively to user settings.
 *
 * Primary purpose: password change requiring the CURRENT password.
 * Also surfaces live session telemetry for the active screen-time /
 * estimated token tracking visible to Plant Admin in User Management.
 */
export default function SettingsPage({ user, currentRole }) {
  const [sessionStarted] = useState(Date.now());
  const [, setTick] = useState(0);

  // Local active-screen-time tracker (ticks every second while open)
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const roleBadge =
    {
      "control-room": "bg-blue-100 text-blue-700 border-blue-200",
      "safety-officer": "bg-red-100 text-red-700 border-red-200",
      "field-technician": "bg-amber-100 text-amber-700 border-amber-200",
      "plant-admin": "bg-emerald-100 text-emerald-700 border-emerald-200",
    }[user?.role] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SettingsIcon size={18} className="text-blue-600" />
        <div>
          <h1 className="text-lg font-bold text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500">Account &amp; security — manage your personal credentials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Password change */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600">
              <KeyRound size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              <p className="text-[10px] text-slate-500">Verify your current password to update it</p>
            </div>
          </div>
          <PasswordChangeForm />
        </div>
<div className="space-y-4">
          {/* Account summary */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <Avatar user={user} size={48} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName || user?.username}</p>
                <p className="text-[10px] text-slate-400">@{user?.username}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${roleBadge}`}>
                  {currentRole?.icon} {currentRole?.name || user?.role}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <p className="uppercase tracking-wide text-slate-400 font-semibold mb-0.5 text-[10px]">Date of Birth</p>
                <p className="text-xs font-semibold text-slate-700">{user?.dob || "—"}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <p className="uppercase tracking-wide text-slate-400 font-semibold mb-0.5 text-[10px]">Working Since</p>
                <p className="text-xs font-semibold text-slate-700">{user?.workingSince || "—"}</p>
              </div>
            </div>
          </div>

          {/* Session telemetry */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck size={15} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Active Session Telemetry</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1 flex items-center justify-center gap-1">
                  <Clock3 size={11} className="text-blue-500" /> Screen Time
                </p>
                <p className="text-lg font-bold text-slate-900">{fmtElapsed(sessionStarted)}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">this session (live)</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1 flex items-center justify-center gap-1">
                  <Zap size={11} className="text-amber-500" /> Est. Tokens
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {Math.max(0, Math.round((Date.now() - sessionStarted) / 60000)) * 5}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">~ per active minute</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">
              Screen-time &amp; token counters for every account are visible to Plant Admin in the User Management page.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl">
        <UserCheck size={13} className="text-emerald-600 shrink-0" />
        <p className="text-[10px] text-emerald-700">
          Password changes are recorded in the Audit Logs · MRPL air-gapped security policy
        </p>
      </div>
    </div>
  );
}