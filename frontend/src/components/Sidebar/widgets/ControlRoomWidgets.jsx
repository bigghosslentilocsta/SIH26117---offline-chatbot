import React from "react";
import { User, UserCog } from "lucide-react";

/**
 * Control Room Engineer sidebar widgets:
 *  - User profile card with avatar, name, DOB, tenure, password change link
 *  Uses `user` prop from authenticated session instead of hardcoded values.
 */
export default function ControlRoomWidgets({ user }) {
  const displayName = user?.fullName || user?.username || "Unknown User";
  const dob = user?.dob || "—";
  const workingSince = user?.workingSince || "—";

  return (
    <div className="space-y-3">
      {/* Operator Profile Card */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Operator Profile
        </p>

        {/* Avatar + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md shrink-0">
            <User size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-500">
              Control Room Engineer
            </p>
          </div>
        </div>

        {/* DOB + Tenure */}
        <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
            <p className="text-slate-400 font-medium">DOB</p>
            <p className="text-slate-700 font-semibold">{dob}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
            <p className="text-slate-400 font-medium">Working Since</p>
            <p className="text-slate-700 font-semibold">{workingSince}</p>
          </div>
        </div>

        {/* Password Change */}
        <button className="w-full text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg py-1.5 transition-colors border border-blue-200 hover:border-blue-300">
          <UserCog size={12} className="inline mr-1" />
          Change Password
        </button>
      </div>
    </div>
  );
}
