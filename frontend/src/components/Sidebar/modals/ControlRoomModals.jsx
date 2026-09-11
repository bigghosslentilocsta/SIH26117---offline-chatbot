import React, { useState } from "react";
import { AlertTriangle, Activity, Thermometer, Gauge, Flame } from "lucide-react";
import ModalOverlay from "../ModalOverlay.jsx";

/* ── Active Alarms Modal ── */
export function ActiveAlarmsModal({ onClose }) {
  const [alarms, setAlarms] = useState([
    { id: "ALM-001", unit: "VDU-201", tag: "PI-2015", message: "Vacuum pump vibration above 4.5 mm/s RMS", priority: "HIGH", time: "14:28", acked: false },
    { id: "ALM-002", unit: "CDU-101", tag: "TI-1042", message: "Column overhead temperature deviation +3.2°C", priority: "MEDIUM", time: "14:15", acked: false },
    { id: "ALM-003", unit: "FCCU-301", tag: "FI-3018", message: "Regenerator air blower flow low", priority: "HIGH", time: "13:58", acked: true },
    { id: "ALM-004", unit: "CDU-101", tag: "LI-1008", message: "Crude charge drum level rising — approaching HH", priority: "CRITICAL", time: "13:42", acked: false },
  ]);

  const pColor = { CRITICAL: "bg-red-100 border-red-400 text-red-800", HIGH: "bg-amber-100 border-amber-400 text-amber-800", MEDIUM: "bg-blue-100 border-blue-400 text-blue-800" };

  return (
    <ModalOverlay title="Active Alarms — Real-Time DCS Feed" onClose={onClose} width="max-w-3xl">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {alarms.filter(a => !a.acked).length} unacknowledged
          </p>
          <button onClick={() => setAlarms(prev => prev.map(a => ({ ...a, acked: true })))}
            className="text-[11px] font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
            Acknowledge All
          </button>
        </div>
        {alarms.map(a => (
          <div key={a.id} className={`p-3 rounded-xl border-2 ${a.acked ? "opacity-60 bg-slate-50 border-slate-200" : pColor[a.priority]}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} />
                <span className="text-xs font-bold">{a.id}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/60">{a.unit}</span>
                <span className="text-[10px] text-slate-500">{a.tag}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">{a.time}</span>
                {!a.acked && (
                  <button onClick={() => setAlarms(prev => prev.map(x => x.id === a.id ? { ...x, acked: true } : x))}
                    className="text-[10px] font-medium bg-white/60 hover:bg-white px-2 py-0.5 rounded">ACK</button>
                )}
              </div>
            </div>
            <p className="text-[11px]">{a.message}</p>
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
}

/* ── Unit Status Modal ── */
export function UnitStatusModal({ onClose }) {
  const units = [
    { name: "CDU-101", status: "normal", temp: "345°C", pressure: "1.2 bar", feed: "14500 BPD", yield: "32.4%" },
    { name: "VDU-201", status: "warning", temp: "412°C", pressure: "0.08 bar", feed: "8200 BPD", yield: "28.1%" },
    { name: "FCCU-301", status: "normal", temp: "530°C", pressure: "2.1 bar", feed: "12800 BPD", yield: "44.7%" },
  ];
  const sBg = { normal: "border-emerald-200 bg-emerald-50/50", warning: "border-amber-200 bg-amber-50/50", critical: "border-red-200 bg-red-50/50" };
  const sDot = { normal: "bg-emerald-500", warning: "bg-amber-500 animate-pulse", critical: "bg-red-500 animate-pulse" };

  return (
    <ModalOverlay title="Unit Status — CDU / VDU / FCCU" onClose={onClose} width="max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {units.map(u => (
          <div key={u.name} className={`p-4 rounded-xl border-2 ${sBg[u.status]}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-900">{u.name}</p>
              <span className={`h-3 w-3 rounded-full ${sDot[u.status]}`} />
            </div>
            <div className="space-y-2 text-[11px]">
              {[["Temperature", u.temp], ["Pressure", u.pressure], ["Feed Rate", u.feed], ["Yield", u.yield]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-semibold text-slate-800">{v}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
}

/* ── P&ID Quick-Reference Modal ── */
export function PIDRefModal({ onClose }) {
  const [sel, setSel] = useState(null);
  const diagrams = [
    { id: "cdu", name: "CDU — Crude Distillation Unit", tags: [["TI-1042","Overhead temperature"],["PIC-1015","Column pressure control"],["FI-1008","Crude charge flow"],["LI-1008","Charge drum level"]],
      notes: "Key interlocks: Column overpressure → PSV-1001A/B → flare. High drum level → FCV-1008 trip." },
    { id: "vdu", name: "VDU — Vacuum Distillation Unit", tags: [["PI-2015","Vacuum pump suction pressure"],["TI-2022","Wash zone temperature"],["FI-2010","VGO product flow"]],
      notes: "Critical: Maintain vacuum < 40 mmHg abs. Loss of vacuum → auto-trip CDU charge." },
    { id: "fccu", name: "FCCU — Fluid Catalytic Cracking", tags: [["TI-3055","Riser outlet temperature"],["FI-3018","Regenerator air flow"],["PI-3022","Regenerator pressure"],["SIC-3035","Slide valve position"]],
      notes: "Emergency: Regenerator temp > 730°C → trip main air blower. Anti-surge protection on WGC." },
  ];

  return (
    <ModalOverlay title="P&ID Quick Reference" onClose={onClose} width="max-w-3xl">
      <div className="space-y-3">
        {diagrams.map(d => (
          <button key={d.id} onClick={() => setSel(sel === d.id ? null : d.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${sel === d.id ? "border-blue-500 bg-blue-50/50 shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
            <p className="text-sm font-bold text-slate-900">{d.name}</p>
            {sel === d.id && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {d.tags.map(([tag, desc]) => (
                    <div key={tag} className="flex items-center gap-2 text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="font-mono font-bold text-blue-700">{tag}</span>
                      <span className="text-slate-600">{desc}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <strong>⚠ Notes:</strong> {d.notes}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>
    </ModalOverlay>
  );
}
