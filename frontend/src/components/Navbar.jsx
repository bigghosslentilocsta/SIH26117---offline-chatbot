import React from "react";
import { Cpu, Trash2, Bell, Factory, Wifi } from "lucide-react";
import Avatar from "./Avatar.jsx";

export default function Navbar({
  currentRole,
  user,
  onOpenProfile,
  showTelemetry,
  setShowTelemetry,
  messageCount,
  onClearChat,
}) {
  const roleColors = {
    blue: "bg-blue-500/10 text-blue-700 border-blue-500/30",
    red: "bg-red-500/10 text-red-700 border-red-500/30",
    amber: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  };

  return (
    <header className="relative z-[60] bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
      {/* Left - Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-amber-400">
          <Factory size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            MRPL <span className="text-blue-600">AI Workbench</span>
          </h1>
          <p className="text-xs text-slate-500">Offline Enterprise Intelligence</p>
        </div>
      </div>

      {/* Center - Role Badge (read-only, from user profile) */}
      <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
        <span className="text-lg">{currentRole.icon}</span>
        <div className="text-left">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            {currentRole.systemBadge}
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {currentRole.name}
          </p>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {/* User Identity — avatar opens the Profile modal */}
        {user && (
          <Avatar
            user={user}
            size={36}
            onClick={onOpenProfile}
            className="hidden md:block"
          />
        )}

        <button
          onClick={onClearChat}
          disabled={messageCount === 0}
          title="Clear conversation"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={18} />
        </button>

        <button
          onClick={() => setShowTelemetry(!showTelemetry)}
          title="System telemetry"
          className={`p-2 rounded-lg transition-colors ${
            showTelemetry
              ? "bg-blue-500/10 text-blue-600"
              : "hover:bg-slate-100 text-slate-500"
          }`}
        >
          <Cpu size={18} />
        </button>

        <button
          title="Notifications"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors relative"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
        </button>

        <span
          title="Offline status"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium"
        >
          <Wifi size={14} />
          <span className="hidden sm:inline">Local AI</span>
        </span>
      </div>
    </header>
  );
}