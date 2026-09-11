import React from "react";
import { ChevronLeft, ChevronRight, LogOut, Shield } from "lucide-react";
import { roleAccent, SIDEBAR_NAV } from "./config.js";
import Avatar from "../Avatar.jsx";

/**
 * Main sidebar.
 *
 * Redesigned per the plant-admin workbench spec:
 *  - Clean top-level navigation tabs (Dashboard, Chatbot, User Management,
 *    Audit Logs, Settings).
 *  - No profile section at the top — instead a round user-avatar circle at
 *    the bottom that opens the Profile management modal.
 *  - Logout pinned to the absolute bottom of the sidebar.
 */
export default function Sidebar({
  currentRole,
  user,
  activePage,
  onNavigate,
  onOpenProfile,
  onLogout,
  collapsed,
  onToggleCollapse,
}) {
  const accent = roleAccent[currentRole.color] || roleAccent.blue;

  return (
    <aside
      className={`shrink-0 hidden lg:flex flex-col transition-all duration-300 ease-in-out ${collapsed ? "w-[72px]" : "w-72"}`}
    >
      <div className="flex flex-col gap-3 p-3 h-full">
        {/* Brand header */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden shrink-0">
          <div className={`h-1 ${accent.header}`} />
          <div className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-amber-400 text-base shadow-md shrink-0">
                🏭
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">MRPL AI Workbench</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                    <span>{currentRole.icon}</span>
                    <span className="truncate">{currentRole.name}</span>
                  </p>
                </div>
              )}
              <button
                onClick={onToggleCollapse}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden flex flex-col flex-1 min-h-0">
          {!collapsed && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Navigation</p>
            </div>
          )}
          <nav className="p-1.5">
            {SIDEBAR_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 rounded-xl border transition-all mb-0.5 last:mb-0 ${
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                  } ${isActive ? accent.navActive : `border-transparent ${accent.navHover}`}`}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && (
                    <span className="text-[11px] font-semibold text-left flex-1 leading-tight">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex-1" />

  
        {/* Air-gapped security note */}
          {!collapsed ? (
            <div className="mx-2 mb-2 bg-emerald-50/80 backdrop-blur-md border border-emerald-200 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield size={12} className="text-emerald-600" />
                <p className="text-[10px] font-semibold text-emerald-800">Air-Gapped Secure</p>
              </div>
              <p className="text-[9px] text-emerald-700/80 leading-relaxed">
                100% offline. All data within MRPL enterprise.
              </p>
            </div>
          ) : (
            <div className="flex justify-center pb-2">
              <Shield size={15} className="text-emerald-600" title="Air-Gapped Secure" />
            </div>
          )}
        </div>

        {/* Bottom: avatar (opens profile) + logout pinned at bottom */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-2 shrink-0">
          <button
            onClick={onOpenProfile}
            className={`w-full flex items-center gap-2.5 rounded-xl transition-colors hover:bg-slate-50 ${
              collapsed ? "justify-center px-1 py-1.5" : "px-1.5 py-1.5"
            }`}
            title="Manage profile"
          >
            <Avatar user={user} size={34} />
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.fullName || user?.username || "User"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">@{user?.username || "user"}</p>
              </div>
            )}
          </button>

          {!collapsed ? (
            <div className="px-1.5 mt-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              title="Sign out"
              className="w-full flex items-center justify-center py-1.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors mt-1"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
