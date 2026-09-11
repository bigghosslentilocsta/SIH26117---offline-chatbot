import React, { useState } from "react";
import { FileCheck, Send } from "lucide-react";
import ModalOverlay from "../ModalOverlay.jsx";

/* ── Permit-to-Work Evaluator Modal ── */
export function PTWModal({ onClose }) {
  const [form, setForm] = useState({ type: "Hot Work", area: "", description: "", duration: "8", hazards: "" });
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <ModalOverlay title="Permit-to-Work Created" onClose={onClose}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center"><FileCheck size={28} className="text-emerald-600" /></div>
          <p className="text-lg font-bold text-slate-900 mb-2">PTW-{Math.floor(1000 + Math.random() * 9000)} Created</p>
          <p className="text-sm text-slate-600 mb-1">{form.type} Permit — {form.area}</p>
          <p className="text-xs text-slate-500 mb-4">Valid for {form.duration} hours. Supervisor approval pending.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-xs text-amber-800">
            <strong>⚠ Required before start:</strong>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              <li>Gas test results recorded (LEL &lt; 10%)</li>
              <li>Fire watch personnel assigned</li>
              <li>Neighboring equipment isolated / blinded</li>
              <li>Supervisor sign-off on checklist</li>
            </ul>
          </div>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay title="Permit-to-Work — Create New" onClose={onClose} width="max-w-xl">
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Permit Type</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/40 focus:outline-none">
            {["Hot Work", "Confined Space", "Electrical", "Excavation", "Working at Height", "Line Breaking"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Equipment</label>
            <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} required
              placeholder="e.g. FCCU-301" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/40 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (hours)</label>
            <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} min="1" max="24"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/40 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Work Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={2}
            placeholder="Describe the work to be performed..." className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/40 focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Identified Hazards</label>
          <textarea value={form.hazards} onChange={e => setForm({ ...form, hazards: e.target.value })} rows={2}
            placeholder="e.g. Hydrocarbon release, hot surfaces..." className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/40 focus:outline-none resize-none" />
        </div>
        <button type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md">
          <Send size={14} /> Submit Permit for Approval
        </button>
      </form>
    </ModalOverlay>
  );
}

/* ── OISD Compliance Hub Modal ── */
export function OISDModal({ onClose }) {
  const [expanded, setExpanded] = useState(null);
  const standards = [
    { code: "OISD-STD-118", title: "Fire & Gas Detection System", status: "Compliant", audit: "15 Jun 2026",
      items: ["F&G panel functional test quarterly", "Detector calibration semi-annually", "Deluge system annual performance test"] },
    { code: "OISD-STD-166", title: "Process Safety Management", status: "Compliant", audit: "22 May 2026",
      items: ["PHA review every 5 years", "MOC register updated", "Safety critical element tracking"] },
    { code: "OISD-STD-172", title: "Management of Change (MoC)", status: "Action Required", audit: "10 Apr 2026",
      items: ["MoC-2026-034 overdue closure", "P&ID redlines pending for VDU-201", "Operator training for FCCU MoC done"] },
    { code: "OISD-STD-196", title: "HAZOP Revalidation", status: "Compliant", audit: "01 Mar 2026",
      items: ["FCCU HAZOP revalidation done", "CDU-2 HAZOP scheduled Q3 2026"] },
  ];
  const sColor = s => s === "Compliant" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";

  return (
    <ModalOverlay title="OISD Compliance Hub" onClose={onClose} width="max-w-3xl">
      <div className="space-y-3">
        {standards.map(s => (
          <button key={s.code} onClick={() => setExpanded(expanded === s.code ? null : s.code)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${expanded === s.code ? "border-blue-500 bg-blue-50/50 shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-lg ${s.status === "Compliant" ? "✅" : "⚠️"}`}>{s.status === "Compliant" ? "✅" : "⚠️"}</span>
                <span className="text-xs font-bold text-slate-900">{s.code}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sColor(s.status)}`}>{s.status}</span>
            </div>
            <p className="text-[11px] text-slate-600">{s.title} · Last audit: {s.audit}</p>
            {expanded === s.code && (
              <div className="mt-3 space-y-1.5">
                {s.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <span className="text-emerald-500 mt-0.5">✓</span><span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </ModalOverlay>
  );
}

/* ── Officer Directory Modal ── */
export function OfficerDirectoryModal({ onClose }) {
  const officers = [
    { name: "Smt. Priya Kulkarni", role: "Chief SHE Officer", area: "HSE Division", phone: "Ext. 4201" },
    { name: "Shri Rajesh Naik", role: "Fire Safety Officer", area: "Fire & Rescue", phone: "Ext. 4205" },
    { name: "Shri Mohan Das", role: "Environmental Officer", area: "EHS — Environment", phone: "Ext. 4210" },
    { name: "Shri Arun Sharma", role: "Occupational Health Officer", area: "EHS — Health", phone: "Ext. 4215" },
  ];
  return (
    <ModalOverlay title="SHE Officer Directory" onClose={onClose}>
      <div className="space-y-2">
        {officers.map(o => (
          <div key={o.name} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">{o.name.split(" ").pop()[0]}</div>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-900">{o.name}</p><p className="text-[10px] text-slate-500">{o.role} · {o.area}</p></div>
            <span className="text-[10px] font-mono text-blue-600">{o.phone}</span>
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
}

/* ── Environmental Checklists Modal ── */
export function EnvChecklistsModal({ onClose }) {
  const lists = [
    { name: "Emission Monitoring (CEMS)", freq: "Continuous", status: "Active", items: ["Stack opacity < 10%", "SO₂ < 50 mg/Nm³", "NOx < 100 mg/Nm³", "CO < 50 mg/Nm³"] },
    { name: "Effluent Quality (ETP)", freq: "Daily", status: "Active", items: ["pH 6.5–8.5", "COD < 250 mg/L", "BOD < 30 mg/L", "Oil & Grease < 10 mg/L"] },
    { name: "Groundwater Monitoring", freq: "Monthly", status: "Pending", items: ["Sampling from 4 monitoring wells", "Heavy metals analysis", "VOC screening"] },
  ];
  return (
    <ModalOverlay title="Environmental Checklists" onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        {lists.map(c => (
          <div key={c.name} className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">🌿 {c.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{c.status} · {c.freq}</span>
            </div>
            <div className="space-y-1">{c.items.map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-[11px] text-slate-600 hover:text-slate-800 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-400" />{item}
              </label>
            ))}</div>
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
}
