import React, { useState } from "react";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Password change form.
 *
 * Requires the user to enter their CURRENT password before updating it.
 * Calls PUT /api/users/password which re-verifies the current password
 * server-side and records a password_change audit event.
 */
export default function PasswordChangeForm({ compact = false }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword || !newPassword) {
      setMessage({ type: "error", text: "Current and new password are both required." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.detail || "Failed to update password." });
      }
    } catch {
      setMessage({ type: "error", text: "Unable to reach the backend service." });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all placeholder:text-slate-400`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {message && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
          )}
          <p className="text-[11px] leading-relaxed">{message.text}</p>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
          Current Password *
        </label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
            className={`${inputCls} pl-9`}
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
          New Password *
        </label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            required
            className={`${inputCls} pl-9`}
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
          Confirm New Password *
        </label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            required
            className={`${inputCls} pl-9`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
      >
        {saving ? (
          <><Loader2 size={14} className="animate-spin" /> Updating...</>
        ) : (
          <>Update Password</>
        )}
      </button>
    </form>
  );
}