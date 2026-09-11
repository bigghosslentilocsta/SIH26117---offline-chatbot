import {
  LayoutDashboard,
  MessageSquare,
  Users,
  ClipboardList,
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

/* ─── Primary workbench navigation ───
 * Clean top-level tabs shown in the main sidebar for every role.
 * Pages gate privileged endpoints (User Management / Audit Logs)
 * server-side and surface 403s gracefully.
 */
export const SIDEBAR_NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chatbot", label: "Chatbot", icon: MessageSquare },
  { id: "user-management", label: "User Management", icon: Users },
  { id: "audit-logs", label: "Audit Logs", icon: ClipboardList },
  { id: "settings", label: "Settings", icon: Settings },
];
