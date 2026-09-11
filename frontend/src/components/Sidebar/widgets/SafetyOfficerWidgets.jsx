import React, { useState, useEffect } from "react";
import { FileWarning, BadgeCheck } from "lucide-react";

/**
 * SHE Officer sidebar widgets:
 *  - Active safety permit summary counter (live from /api/refinery/permits)
 *  - Compliance quick-query list
 */
export default function SafetyOfficerWidgets() {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  const complianceItems = [
    "OISD-STD-118: Fire & Gas System",
    "OISD-STD-166: Process Safety",
    "OISD-STD-172: MoC Review",
    "OISD-STD-196: HAZOP Revalidation",
  ];

  useEffect(() => {
    let mounted = true;
    const fetchPermits = async () => {
      try {
        const res = await fetch("/api/refinery/permits");
        if (res.ok) {
          const data = await res.json();
          if (mounted) setPermits(data.permits || []);
        }
      } catch {}
      if (mounted) setLoading(false);
    };
    fetchPermits();
    const iv = setInterval(fetchPermits, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  return (
    <div className="space-y-3">
      {/* Active Permit Summary */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Permits
          </p>
          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {permits.filter((p) => p.status === "Active").length} Active
          </span>
        </div>
        <div className="space-y-2">
          {permits.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] ${
                p.status === "Active"
                  ? "bg-amber-50/80 border-amber-200"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}
            >
              <FileWarning
                size={14}
                className={
                  p.status === "Active"
                    ? "text-amber-500 shrink-0"
                    : "text-slate-400 shrink-0"
                }
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">{p.id}</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded ${
                      p.status === "Active"
                        ? "bg-amber-200 text-amber-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-slate-500">
                  {p.type} · {p.area}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Quick-Query */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          OISD Compliance Quick-Query
        </p>
        <div className="space-y-1.5">
          {complianceItems.map((item, i) => (
            <button
              key={i}
              className="w-full text-left text-[11px] text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-2.5 py-2 transition-colors border border-transparent hover:border-red-200 flex items-center gap-2"
            >
              <BadgeCheck size={13} className="text-red-400 shrink-0" />
              <span>{item}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
