import {
  Activity,
  AlertTriangle,
  FileSearch,
  UserCog,
  FileCheck,
  Users,
  BookOpen,
  Leaf,
  CheckSquare,
  Mic,
  Stethoscope,
  History,
  ClipboardList,
  HardDrive,
  Settings,
} from "lucide-react";

/* ─── Per-role accent colour tokens ─── */
export const roleAccent = {
  blue: {
    navHover: "hover:bg-blue-50 hover:border-blue-300 text-blue-700",
    navActive: "bg-blue-50 border-blue-500 text-blue-800 shadow-sm",
    header: "bg-blue-600",
  },
  red: {
    navHover: "hover:bg-red-50 hover:border-red-300 text-red-700",
    navActive: "bg-red-50 border-red-500 text-red-800 shadow-sm",
    header: "bg-red-600",
  },
  amber: {
    navHover: "hover:bg-amber-50 hover:border-amber-300 text-amber-700",
    navActive: "bg-amber-50 border-amber-500 text-amber-800 shadow-sm",
    header: "bg-amber-600",
  },
  emerald: {
    navHover: "hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700",
    navActive: "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm",
    header: "bg-emerald-600",
  },
};

/* ─── Navigation definitions per role ─── */
export const roleNavItems = {
  "control-room": [
    { id: "unit-status", label: "Unit Status (CDU/VDU/FCCU)", icon: Activity },
    { id: "active-alarms", label: "Active Alarms", icon: AlertTriangle },
    { id: "pid-ref", label: "P&ID Quick-Ref", icon: FileSearch },
    { id: "profile", label: "Profile & Settings", icon: UserCog },
  ],
  "safety-officer": [
    { id: "ptw", label: "Permit-to-Work Evaluator", icon: FileCheck },
    { id: "officer-dir", label: "Officer Directory", icon: Users },
    { id: "oisd", label: "OISD Compliance Hub", icon: BookOpen },
    { id: "env-checklists", label: "Environmental Checklists", icon: Leaf },
  ],
  "field-technician": [
    { id: "sop", label: "SOP Checklists", icon: CheckSquare },
    { id: "voice-logs", label: "Voice-to-Text Logs", icon: Mic },
    { id: "diagnostics", label: "Symptom Diagnostics", icon: Stethoscope },
    { id: "equip-history", label: "Equipment History", icon: History },
  ],
  "plant-admin": [
    { id: "user-mgmt", label: "User Management", icon: Users },
    { id: "audit-logs", label: "Audit Logs", icon: ClipboardList },
    { id: "hw-telemetry", label: "Hardware Telemetry", icon: HardDrive },
    { id: "sys-settings", label: "System Settings", icon: Settings },
  ],
};
