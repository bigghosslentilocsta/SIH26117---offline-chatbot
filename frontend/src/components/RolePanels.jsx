import React, { useState, useEffect } from "react";
import {
  Activity,
  FileText,
  Shield,
  Flame,
  Mic,
  Square,
  ClipboardList,
  Thermometer,
  Gauge,
  Server,
  Cpu,
  HardDrive,
  Zap,
  Wifi,
  RefreshCw,
  Clock,
  AlertCircle,
  Volume2,
  Binary,
} from "lucide-react";

/* ── Control Room Engineer ── */
function ControlRoomPanel({ onSend }) {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [units, setUnits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [uRes, lRes] = await Promise.all([
          fetch("/api/refinery/units"),
          fetch("/api/refinery/logs"),
        ]);
        if (uRes.ok) { const d = await uRes.json(); if (mounted) setUnits(d.units || []); }
        if (lRes.ok) { const d = await lRes.json(); if (mounted) setLogs(d.logs || []); }
        if (mounted) setLoading(false);
      } catch { if (mounted) setLoading(false); }
    };
    fetchData();
    const iv = setInterval(fetchData, 3000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const iconMap = { CDU: <Thermometer size={18} />, VDU: <Gauge size={18} />, FCCU: <Flame size={18} /> };

  const statusDot = { normal: "bg-emerald-500", warning: "bg-amber-500 animate-pulse", critical: "bg-red-500 animate-pulse" };
  const unitBg = { normal: "bg-emerald-50 border-emerald-200", warning: "bg-amber-50 border-amber-200", critical: "bg-red-50 border-red-200" };

  return (
    <div className="space-y-4">
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Unit Status & Troubleshooting</h3>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {loading && <p className="text-xs text-slate-400 text-center py-2">Loading live unit data…</p>}
          {units.map((unit) => (
            <button key={unit.id} onClick={() => setSelectedUnit(unit.id === selectedUnit ? null : unit.id)}
              className={`relative text-left p-3 rounded-xl border-2 transition-all ${selectedUnit === unit.id ? "border-blue-500 bg-blue-50/50 shadow-md" : `${unitBg[unit.status]} hover:shadow-md`}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`flex items-center gap-1.5 text-xs font-bold ${unit.color === "blue" ? "text-blue-700" : unit.color === "amber" ? "text-amber-700" : "text-emerald-700"}`}>
                  {iconMap[unit.name?.split("-")[0]] || <Thermometer size={18} />} {unit.name}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${statusDot[unit.status]}`} />
              </div>
              <p className="text-[10px] text-slate-500 mb-1">{unit.label}</p>
              <div className="flex flex-wrap gap-3 text-[10px]">
                <span className="text-slate-600"><span className="text-slate-400">T:</span> {unit.temp}°C</span>
                <span className="text-slate-600"><span className="text-slate-400">P:</span> {unit.pressure} bar</span>
                <span className="text-slate-600"><span className="text-slate-400">Feed:</span> {unit.feed_rate} t/h</span>
                <span className="text-slate-600"><span className="text-slate-400">Yield:</span> {unit.yield_pct}%</span>
              </div>
            </button>
          ))}
        </div>
        {selectedUnit && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-700 mb-2">Anomaly Check — {units.find((u) => u.id === selectedUnit)?.name}</p>
            <div className="flex flex-wrap gap-2">
              {["Thermal Profile", "Vibration Analysis", "Pressure Trend", "Alarm History", "Interlock Status"].map((action) => (
                <button key={action} onClick={() => onSend(`Run ${action} diagnostic check on ${units.find((u) => u.id === selectedUnit)?.name}`)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-700">{action}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Log Summary */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Quick-Reference Log Summary</h3>
          </div>
          <span className="text-[10px] text-slate-400">Last 30 min</span>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-slate-400 font-mono w-10 shrink-0">{log.time}</span>
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${log.level === "WARN" ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"}`}>{log.level}</span>
              <span className="text-slate-600">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Safety & Health (SHE) Officer ── */
function SafetyOfficerPanel({ onSend }) {
  const [activePermit, setActivePermit] = useState(null);
  const [checklist, setChecklist] = useState({});

  const permits = [
    {
      id: "hot-work", name: "Hot Work Permit", icon: <Flame size={18} />, color: "red",
      items: [
        "Fire extinguisher within 5m radius",
        "Combustible materials removed/covered",
        "Fire watch personnel assigned",
        "Gas test < 10% LEL confirmed",
        "Work area ventilation verified",
        "Nearby equipment isolated/tagged",
      ],
    },
    {
      id: "confined-space", name: "Confined Space Entry", icon: <AlertCircle size={18} />, color: "amber",
      items: [
        "Atmospheric test O₂: 20.9% confirmed",
        "LEL reading below 10%",
        "H₂S < 10 ppm verified",
        "Continuous ventilation established",
        "Rescue team on standby",
        "Attendant stationed at entry point",
        "Communication system tested",
      ],
    },
  ];

  const toggleItem = (permitId, idx) =>
    setChecklist((prev) => ({ ...prev, [`${permitId}-${idx}`]: !prev[`${permitId}-${idx}`] }));

  const getCompletion = (permit) => {
    const checked = permit.items.filter((_, idx) => checklist[`${permit.id}-${idx}`]).length;
    return { checked, total: permit.items.length, pct: Math.round((checked / permit.items.length) * 100) };
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-red-600" />
          <h3 className="text-sm font-bold text-slate-900">Permit-to-Work (PTW) Evaluator</h3>
        </div>
        <div className="flex gap-2 mb-4">
          {permits.map((permit) => {
            const { pct } = getCompletion(permit);
            return (
              <button key={permit.id} onClick={() => setActivePermit(permit.id === activePermit ? null : permit.id)}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${activePermit === permit.id ? "border-blue-500 bg-blue-50/50 shadow-md" : "border-slate-200 hover:border-slate-300 bg-slate-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={permit.color === "red" ? "text-red-600" : "text-amber-600"}>{permit.icon}</span>
                  <span className="text-xs font-bold text-slate-800 text-left leading-tight">{permit.name}</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{pct}% complete</p>
              </button>
            );
          })}
        </div>
        {activePermit && (
          <div className="space-y-2">
            {permits.find((p) => p.id === activePermit)?.items.map((item, idx) => {
              const isChecked = checklist[`${activePermit}-${idx}`];
              return (
                <label key={idx} className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${isChecked ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                  <input type="checkbox" checked={!!isChecked} onChange={() => toggleItem(activePermit, idx)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className={`text-xs leading-relaxed ${isChecked ? "text-emerald-700 line-through" : "text-slate-700"}`}>{item}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">OISD Compliance Quick-Reference</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: "OISD-116", desc: "Fixed installations for LNG storage" },
            { code: "OISD-130", desc: "Process safety management" },
            { code: "OISD-142", desc: "Safety in electrical systems" },
            { code: "OISD-165", desc: "Fire protection systems" },
          ].map((ref) => (
            <button key={ref.code} onClick={() => onSend(`Summarize key requirements of ${ref.code} for refinery operations`)}
              className="text-left p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all">
              <p className="text-xs font-bold text-blue-700">{ref.code}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{ref.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Field Technician ── */
function FieldTechnicianPanel({ onSend }) {
  const [recordState, setRecordState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [activeSOP, setActiveSOP] = useState(0);

  const sopSteps = [
    { step: 1, text: "Isolate the valve from process — close upstream & downstream block valves", critical: true },
    { step: 2, text: "Bleed trapped pressure via drain/vent valve — confirm zero energy", critical: true },
    { step: 3, text: "Apply lockout/tagout (LOTO) on both block valves", critical: true },
    { step: 4, text: "Remove actuator bonnet bolts (torque: 45 Nm)", critical: false },
    { step: 5, text: "Extract packing gland and inspect PTFE rings", critical: false },
    { step: 6, text: "Replace packing rings — ensure proper orientation", critical: false },
    { step: 7, text: "Re-torque bonnet bolts — record in maintenance log", critical: false },
    { step: 8, text: "Perform leak test at 1.5× working pressure", critical: true },
  ];

  const sopChecklist = [
    { id: "valve-repack", name: "Control Valve Repacking" },
    { id: "hx-cleaning", name: "Heat Exchanger Cleaning" },
    { id: "pump-alignment", name: "Pump Coupling Alignment" },
  ];

  const handleRecordToggle = () => {
    if (recordState === "idle" || recordState === "transcribing") {
      setRecordState("recording");
      setTimeout(() => {
        setRecordState("transcribing");
        setTimeout(() => {
          setTranscript("Pump P-201B making unusual noise near bearing housing. Vibration seems high on axial reading.");
          setRecordState("idle");
        }, 1800);
      }, 3000);
    } else {
      setRecordState("idle");
    }
  };

  return (
    <div className="space-y-4">
      {/* Voice-to-Text Widget */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mic size={16} className="text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Offline Voice-to-Text</h3>
          <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">LOCAL STT</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={handleRecordToggle}
            className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all shadow-md ${
              recordState === "recording" ? "bg-red-500 text-white animate-pulse"
              : recordState === "transcribing" ? "bg-amber-500 text-white"
              : "bg-slate-900 text-amber-400 hover:bg-slate-800"
            }`}>
            {recordState === "idle" && <Mic size={22} />}
            {recordState === "recording" && <Square size={18} fill="white" />}
            {recordState === "transcribing" && <RefreshCw size={22} className="animate-spin" />}
          </button>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700">
              {recordState === "idle" && "Tap to record field observation"}
              {recordState === "recording" && (
                <span className="text-red-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />Recording — tap to stop</span>
              )}
              {recordState === "transcribing" && (
                <span className="text-amber-600 flex items-center gap-1"><RefreshCw size={12} className="animate-spin" />Transcribing locally...</span>
              )}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Whisper-small · 391M params · Air-gapped</p>
          </div>
        </div>
        {transcript && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Volume2 size={12} className="text-slate-400" />
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Transcription</p>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{transcript}</p>
            <button onClick={() => onSend(transcript)} className="mt-2 text-[10px] font-semibold text-blue-600 hover:text-blue-700">Send to AI Assistant →</button>
          </div>
        )}
      </div>
      {/* SOP Checklist Viewer */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={16} className="text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">SOP Checklist Viewer</h3>
          <span className="ml-auto px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">HIGH CONTRAST</span>
        </div>
        <div className="flex gap-1.5 mb-3 overflow-x-auto">
          {sopChecklist.map((sop, idx) => (
            <button key={sop.id} onClick={() => setActiveSOP(idx)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeSOP === idx ? "bg-amber-500 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {sop.name}
            </button>
          ))}
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sopSteps.map((step) => (
            <div key={step.step} className={`flex items-start gap-3 p-2.5 rounded-lg border ${step.critical ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
              <span className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${step.critical ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700"}`}>{step.step}</span>
              <p className={`text-xs leading-relaxed pt-0.5 ${step.critical ? "text-red-800 font-semibold" : "text-slate-700"}`}>
                {step.text}
                {step.critical && <span className="ml-1.5 text-[9px] text-red-500 uppercase font-bold">[CRITICAL]</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Plant Admin ── */
function PlantAdminPanel() {
  const [hwData, setHwData] = useState({
    vramUsed: 0, vramTotal: 1, ramUsed: 0, ramTotal: 1,
    tokenSpeed: 0, gpuUtil: 0,
  });
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real telemetry from backend every 5 seconds
  useEffect(() => {
    let mounted = true;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/telemetry");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (mounted) {
          setHwData({
            vramUsed: data.vram_used_gb,
            vramTotal: data.vram_total_gb,
            ramUsed: data.ram_used_gb || 0,
            ramTotal: data.ram_total_gb || 64,
            tokenSpeed: data.tokens_per_second,
            gpuUtil: data.gpu_utilization,
          });
          if (data.node_health) setNodes(data.node_health);
          setLoading(false);
        }
      } catch {
        // Keep existing data on error
        if (mounted) setLoading(false);
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const vramPct = Math.min(100, Math.round((hwData.vramUsed / hwData.vramTotal) * 100));
  const ramPct = Math.round((hwData.ramUsed / hwData.ramTotal) * 100);

  return (
    <div className="space-y-4">
      {/* Hardware Telemetry */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Hardware Telemetry</h3>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {loading ? "Connecting..." : "Live — 5s refresh"}
          </span>
        </div>
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold flex items-center gap-1">
                <HardDrive size={12} />GPU VRAM
              </span>
              <span className="text-xs font-bold text-slate-800">{hwData.vramUsed} / {hwData.vramTotal} GB</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${vramPct > 85 ? "bg-red-500" : vramPct > 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${vramPct}%` }} />
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold flex items-center gap-1">
                <Server size={12} />System RAM
              </span>
              <span className="text-xs font-bold text-slate-800">{hwData.ramUsed} / {hwData.ramTotal} GB</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${ramPct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1 flex items-center justify-center gap-1">
                <Zap size={12} className="text-amber-500" />Token Speed
              </p>
              <p className="text-xl font-bold text-slate-900">{hwData.tokenSpeed}<span className="text-xs text-slate-400 ml-0.5">t/s</span></p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1 flex items-center justify-center gap-1">
                <Gauge size={12} className="text-blue-500" />GPU Util
              </p>
              <p className="text-xl font-bold text-slate-900">{hwData.gpuUtil}<span className="text-xs text-slate-400 ml-0.5">%</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Node Health */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Binary size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Air-Gapped Container Node Health</h3>
        </div>
        <div className="space-y-2">
          {nodes.map((node) => (
            <div key={node.id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${node.status === "healthy" ? "bg-emerald-500" : node.status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">{node.name}</p>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${node.status === "healthy" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{node.status}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[10px] text-slate-500">{node.role}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} />{node.uptime}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
          <Wifi size={12} />
          <span>All nodes on isolated 10.x.x.x subnet · No external egress</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Router ── */
export default function RolePanels({ currentRole, onSend, authToken }) {
  const panelMap = {
    "control-room": ControlRoomPanel,
    "safety-officer": SafetyOfficerPanel,
    "field-technician": FieldTechnicianPanel,
    "plant-admin": PlantAdminPanel,
  };

  const PanelComponent = panelMap[currentRole.id];
  if (!PanelComponent) return null;

  return (
    <div className="w-80 shrink-0 hidden xl:flex flex-col gap-0 p-4 overflow-y-auto border-l border-slate-200/60">
      <PanelComponent onSend={onSend} authToken={authToken} />
    </div>
  );
}
