import React, { useState } from "react";
import {
  Shield, Clock, ScrollText, ChevronLeft, ChevronRight,
  ChevronRight as ChevronNav,
} from "lucide-react";
import { roleAccent, roleNavItems } from "./config.js";
import ControlRoomWidgets from "./widgets/ControlRoomWidgets.jsx";
import SafetyOfficerWidgets from "./widgets/SafetyOfficerWidgets.jsx";
import FieldTechnicianWidgets from "./widgets/FieldTechnicianWidgets.jsx";
import PlantAdminWidgets from "./widgets/PlantAdminWidgets.jsx";

// ── Modals per role ──
import { ActiveAlarmsModal, UnitStatusModal, PIDRefModal } from "./modals/ControlRoomModals.jsx";
import { PTWModal, OfficerDirectoryModal, OISDModal, EnvChecklistsModal } from "./modals/SafetyOfficerModals.jsx";
import { SOPChecklistModal, SymptomDiagnosticsModal, EquipmentHistoryModal } from "./modals/FieldTechnicianModals.jsx";
import { UserManagementModal, AuditLogsModal, HWTelemetryModal, SystemSettingsModal } from "./modals/PlantAdminModals.jsx";

/* Map:  role.id -> navItem.id -> Modal component */
const modalMap = {
  "control-room": {
    "unit-status": UnitStatusModal,
    "active-alarms": ActiveAlarmsModal,
    "pid-ref": PIDRefModal,
  },
  "safety-officer": {
    "ptw": PTWModal,
    "officer-dir": OfficerDirectoryModal,
    "oisd": OISDModal,
    "env-checklists": EnvChecklistsModal,
  },
  "field-technician": {
    "sop": SOPChecklistModal,
    "diagnostics": SymptomDiagnosticsModal,
    "equip-history": EquipmentHistoryModal,
  },
  "plant-admin": {
    "user-mgmt": UserManagementModal,
    "audit-logs": AuditLogsModal,
    "hw-telemetry": HWTelemetryModal,
    "sys-settings": SystemSettingsModal,
  },
};

const widgetMap = {
  "control-room": ControlRoomWidgets,
  "safety-officer": SafetyOfficerWidgets,
  "field-technician": FieldTechnicianWidgets,
  "plant-admin": PlantAdminWidgets,
};

export default function Sidebar({ currentRole, user, messages, collapsed, onToggleCollapse, onSend, setVoiceText }) {
  const [activeNav, setActiveNav] = useState(null);
  const [openModal, setOpenModal] = useState(null);
  const accent = roleAccent[currentRole.color] || roleAccent.blue;
  const navItems = roleNavItems[currentRole.id] || [];
  const recentMessages = messages.slice(-4).reverse();
  const WidgetPanel = widgetMap[currentRole.id];

  /* Resolve which modal to show */
  const roleModals = modalMap[currentRole.id] || {};
  const ModalComponent = openModal ? roleModals[openModal] : null;

  return (
    <aside className={`shrink-0 hidden lg:flex flex-col overflow-y-auto transition-all duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-80"}`}>
      <div className="flex flex-col gap-3 p-3 h-full">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          <div className={`h-1 ${accent.header}`} />
          <div className="p-3">
            <div className="flex items-center gap-2.5">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${accent.header} text-white text-lg shadow-md shrink-0`}>{currentRole.icon}</div>
              {!collapsed && (<div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{currentRole.systemBadge}</p>
                <p className="text-sm font-bold text-slate-900 truncate">{currentRole.name}</p>
                <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 mt-0.5">{currentRole.description}</p>
              </div>)}
              <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          {!collapsed && (<div className="px-3 pt-3 pb-1"><p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Navigation</p></div>)}
          <nav className="p-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button key={item.id} onClick={() => {
                    if (isActive) { setActiveNav(null); setOpenModal(null); }
                    else { setActiveNav(item.id); setOpenModal(item.id); }
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-xl border transition-all mb-0.5 last:mb-0 ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} ${isActive ? accent.navActive : `border-transparent ${accent.navHover}`}`}
                  title={collapsed ? item.label : undefined}>
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && (<>
                    <span className="text-[11px] font-semibold text-left flex-1 leading-tight">{item.label}</span>
                    <ChevronNav size={12} className={`shrink-0 transition-transform ${isActive ? "rotate-90 text-slate-400" : "text-slate-300"}`} />
                  </>)}
                </button>
              );
            })}
          </nav>
        </div>
        {!collapsed && WidgetPanel && (<div className="flex-1 min-h-0 overflow-y-auto"><WidgetPanel onSend={onSend} setVoiceText={setVoiceText} user={user} /></div>)}
        {!collapsed ? (
          <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield size={14} className="text-emerald-600" />
              <p className="text-[11px] font-semibold text-emerald-800">Air-Gapped Secure</p>
            </div>
            <p className="text-[10px] text-emerald-700/80 leading-relaxed">100% offline. No external network calls. All data within MRPL enterprise.</p>
          </div>
        ) : (
          <div className="flex justify-center py-2"><Shield size={16} className="text-emerald-600" title="Air-Gapped Secure" /></div>
        )}
        {!collapsed && messages.length > 0 && (
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Clock size={14} className="text-slate-400" />
              <p className="text-[11px] font-semibold text-slate-800">Recent Activity</p>
            </div>
            <div className="space-y-2">
              {recentMessages.slice(0, 3).map((msg) => (
                <div key={msg.id} className="text-[10px] bg-slate-50 border border-slate-100 rounded-lg p-2">
                  <p className="font-medium text-slate-500 mb-0.5">{msg.role === "user" ? "You" : currentRole.name} · {msg.timestamp}</p>
                  <p className="text-slate-700 line-clamp-2">{msg.content.slice(0, 100)}{msg.content.length > 100 ? "..." : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {!collapsed && (
          <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-2xl p-2.5 text-center shrink-0">
            <p className="text-[10px] text-slate-400"><ScrollText size={10} className="inline mr-1" />MRPL AI Workbench v1.0.0</p>
          </div>
        )}
      </div>

      {/* ── Modal overlay for nav items ── */}
      {ModalComponent && <ModalComponent onClose={() => { setOpenModal(null); setActiveNav(null); }} />}
    </aside>
  );
}
