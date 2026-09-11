import React from "react";
import ModalOverlay from "./Sidebar/ModalOverlay.jsx";
import Avatar from "./Avatar.jsx";
import PasswordChangeForm from "./PasswordChangeForm.jsx";
import { Calendar, Briefcase, BadgeInfo, KeyRound } from "lucide-react";

/**
 * Profile management modal.
 *
 * Opened by clicking the round user avatar in the sidebar (or navbar).
 * Shows the logged-in user's profile details plus a password-change form
 * (current password required).
 */
export default function ProfileModal({ user, currentRole, onClose }) {
  const roleColor =
    {
      "control-room": "bg-blue-100 text-blue-700 border-blue-200",
      "safety-officer": "bg-red-100 text-red-700 border-red-200",
      "field-technician": "bg-amber-100 text-amber-700 border-amber-200",
      "plant-admin": "bg-emerald-100 text-emerald-700 border-emerald-200",
    }[user?.role] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <ModalOverlay title="Profile Management" onClose={onClose} width="max-w-lg">
      <div className="space-y-5">
        {/* Identity header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <Avatar user={user} size={64} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {user?.fullName || user?.username || "MRPL User"}
            </p>
            <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
            <span
              className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleColor}`}
            >
              {currentRole?.icon} {currentRole?.name || user?.role}
            </span>
          </div>
        </div>

        {/* Profile details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl p-3">
            <BadgeInfo size={15} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Employee ID</p>
              <p className="text-xs font-semibold text-slate-800">{user?.username || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl p-3">
            <Calendar size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Date of Birth</p>
              <p className="text-xs font-semibold text-slate-800">{user?.dob || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl p-3">
            <Briefcase size={15} className="text-emerald-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Working Since</p>
              <p className="text-xs font-semibold text-slate-800">{user?.workingSince || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl p-3">
            <KeyRound size={15} className="text-red-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Account Status</p>
              <p
                className={`text-xs font-bold uppercase ${
                  user?.status === "active" ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {user?.status || "active"}
              </p>
            </div>
          </div>
        </div>

        {/* Password change */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={15} className="text-blue-600" />
            <p className="text-xs font-bold text-slate-800">Change Password</p>
          </div>
          <PasswordChangeForm />
        </div>
      </div>
    </ModalOverlay>
  );
}