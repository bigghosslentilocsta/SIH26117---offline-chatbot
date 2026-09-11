import React, { useState, useEffect } from "react";
import { UserPlus, Server, Clock } from "lucide-react";
import { UserManagementModal } from "../modals/PlantAdminModals.jsx";

/**
 * Plant Admin sidebar widgets:
 *  - Active node health indicators (live from /api/telemetry)
 *  - Rapid user creation modal trigger
 */
export default function PlantAdminWidgets() {
  const [nodes, setNodes] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchNodes = async () => {
      try {
        const res = await fetch("/api/telemetry");
        if (res.ok) {
          const data = await res.json();
          if (mounted) setNodes(data.node_health || []);
        }
      } catch {}
    };
    fetchNodes();
    const iv = setInterval(fetchNodes, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  return (
    <div className="space-y-3">
      {/* Quick User Create */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        <button
          onClick={() => setShowUserModal(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-md"
        >
          <UserPlus size={16} />
          New User
        </button>
      </div>

      {/* Active Node Health */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server size={14} className="text-emerald-600" />
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Node Health
          </p>
        </div>
        <div className="space-y-2">
          {nodes.map((node) => (
            <div
              key={node.name}
              className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  node.status === "healthy"
                    ? "bg-emerald-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-800 truncate">
                    {node.name}
                  </p>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      node.status === "healthy"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {node.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[10px] text-slate-500">{node.role}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={9} />
                    {node.uptime}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showUserModal && (
        <UserManagementModal
          defaultShowCreate
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  );
}
