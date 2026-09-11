import React from "react";
import { Zap } from "lucide-react";

export default function QuickPrompts({ currentRole, onSend }) {
  return (
    <div className="mt-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-800">
          Quick Actions for {currentRole.name}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {currentRole.quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSend(prompt)}
            className="text-left px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-sm text-slate-700 hover:text-slate-900 group"
          >
            <span className="flex items-start gap-2">
              <span className="text-blue-400 group-hover:text-blue-600 mt-0.5">
                ›
              </span>
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}