import React, { useState } from "react";
import { CheckSquare, Mic, Stethoscope, History, Clock, AlertCircle } from "lucide-react";
import ModalOverlay from "../ModalOverlay.jsx";

/* ── SOP Checklists Modal ── */
export function SOPChecklistModal({ onClose }) {
  const [checked, setChecked] = useState({});
  const toggle = (k) => setChecked(prev => ({ ...prev, [k]: !prev[k] }));

  const sops = [
    { name: "Control Valve Repacking", steps: ["Isolate & depressurize the valve", "Remove handwheel and bonnet bolts", "Extract old packing rings", "Install new PTFE packing set", "Torque bonnet bolts to spec (per valve data sheet)", "Repressurize and leak-test"] },
    { name: "Pump Seal Replacement", steps: ["Lock-out / Tag-out pump motor", "Drain pump casing", "Remove old mechanical seal", "Inspect shaft sleeve for wear", "Install new seal per OEM instructions", "Prime pump and verify zero leakage"] },
    { name: "Heat Exchanger Inspection", steps: ["Isolate and drain the exchanger", "Remove channel cover / bonnet", "Inspect tubes for fouling / corrosion", "Perform UT thickness measurement on shell", "Replace gaskets", "Hydro-test before returning to service"] },
  ];

  return (
    <ModalOverlay title="SOP Checklists" onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        {sops.map(sop => (
          <div key={sop.name} className="p-4 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2"><CheckSquare size={14} className="text-amber-500" />{sop.name}</p>
            <div className="space-y-1">
              {sop.steps.map((step, i) => {
                const key = `${sop.name}-${i}`;
                return (
                  <label key={i} onClick={() => toggle(key)}
                    className={`flex items-start gap-2 text-[11px] px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${checked[key] ? "bg-emerald-50 text-emerald-700 line-through" : "text-slate-600 hover:bg-slate-50"}`}>
                    <input type="checkbox" checked={!!checked[key]} readOnly className="mt-0.5 rounded border-slate-300 text-emerald-500" />
                    <span>{step}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
}

/* ── Equipment History Modal ── */
export function EquipmentHistoryModal({ onClose }) {
  const history = [
    { eq: "P-104A (CDU)", type: "Centrifugal Pump", events: [
      { date: "08 Jun 2026", action: "Mechanical seal replacement", tech: "Suresh K.", status: "Completed" },
      { date: "15 Apr 2026", action: "Vibration analysis — OK", tech: "AI System", status: "Passed" },
      { date: "22 Jan 2026", action: "Bearing replacement", tech: "Vikram P.", status: "Completed" },
    ]},
    { eq: "E-205 (VDU)", type: "Shell & Tube HX", events: [
      { date: "01 May 2026", action: "Chemical cleaning", tech: "Contractor", status: "Completed" },
      { date: "10 Feb 2026", action: "Tube inspection (borescope)", tech: "Raj M.", status: "Passed" },
    ]},
    { eq: "LCV-3012 (FCCU)", type: "Control Valve", events: [
      { date: "20 Jun 2026", action: "Positioner calibration", tech: "Anil D.", status: "Completed" },
      { date: "05 Mar 2026", action: "Packing replacement", tech: "Suresh K.", status: "Completed" },
    ]},
  ];

  return (
    <ModalOverlay title="Equipment History Logs" onClose={onClose} width="max-w-3xl">
      <div className="space-y-4">
        {history.map(eq => (
          <div key={eq.eq} className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-900">{eq.eq} <span className="text-slate-400 font-normal">({eq.type})</span></p>
            </div>
            <div className="space-y-2">
              {eq.events.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800">{ev.action}</p>
                    <p className="text-[10px] text-slate-500">{ev.tech} · {ev.date}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ev.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{ev.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
}

/* ── Symptom Diagnostics Wizard Modal ── */
export function SymptomDiagnosticsModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [diagnosis, setDiagnosis] = useState(null);

  const questions = [
    { q: "What type of equipment?", options: ["Pump", "Compressor", "Heat Exchanger", "Control Valve", "Vessel / Drum"] },
    { q: "Primary symptom observed?", options: ["Excessive vibration", "Temperature high", "Pressure abnormal", "Flow deviation", "Leakage / visible emission"] },
    { q: "Duration of issue?", options: ["Just started (< 1 hour)", "Intermittent (hours to days)", "Gradual onset (weeks)", "After recent maintenance"] },
  ];

  const diagnoses = {
    "0-0-0": { title: "Pump Cavitation Likely", actions: ["Check NPSH available vs required", "Verify suction strainer is clean", "Lower pump speed or raise suction level"] },
    "0-0-1": { title: "Bearing Wear Detected", actions: ["Schedule vibration spectrum analysis", "Check lubricant condition and level", "Plan bearing replacement at next opportunity"] },
    "0-3-2": { title: "Seal Failure Post-Maintenance", actions: ["Shut down and inspect seal installation", "Verify flush line pressure", "Check for alignment issues"] },
  };

  const handleSelect = (qi, opt) => {
    const newAnswers = { ...answers, [qi]: questions[qi].options.indexOf(opt) };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const key = Object.entries(newAnswers).sort(([a],[b]) => a-b).map(([,v]) => v).join("-");
      setDiagnosis(diagnoses[key] || { title: "Manual Inspection Recommended", actions: ["Schedule a qualified technician for on-site assessment", "Collect vibration and temperature data", "Consult OEM troubleshooting manual"] });
    }
  };

  return (
    <ModalOverlay title="Symptom Diagnostics Wizard" onClose={onClose} width="max-w-xl">
      {!diagnosis ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {questions.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-amber-500" : "bg-slate-200"}`} />
            ))}
          </div>
          <p className="text-xs text-slate-500">Step {step + 1} of {questions.length}</p>
          <p className="text-sm font-bold text-slate-900">{questions[step].q}</p>
          <div className="space-y-2">
            {questions[step].options.map(opt => (
              <button key={opt} onClick={() => handleSelect(step, opt)}
                className="w-full text-left text-[11px] p-3 rounded-xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-slate-700 font-medium">
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-bold text-amber-800">🩺 {diagnosis.title}</p>
          </div>
          <p className="text-xs font-semibold text-slate-700">Recommended Actions:</p>
          <div className="space-y-2">
            {diagnosis.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <span className="text-emerald-500 mt-0.5 font-bold">{i + 1}.</span>
                <span className="text-slate-700">{a}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setStep(0); setAnswers({}); setDiagnosis(null); }}
            className="w-full text-[11px] font-medium text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition-colors">
            Start New Diagnosis
          </button>
        </div>
      )}
    </ModalOverlay>
  );
}
