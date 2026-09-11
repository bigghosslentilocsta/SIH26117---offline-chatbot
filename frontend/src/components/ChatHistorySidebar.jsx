import React from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

function relTime(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ROLE_SHORT = {
  "control-room": "Control Room",
  "safety-officer": "SHE Officer",
  "field-technician": "Field Tech",
  "plant-admin": "Plant Admin",
};

/**
 * Nested chat history sidebar, rendered INSIDE the Chatbot interface
 * (ChatGPT / Gemini style). Lists past sessions by descriptive title,
 * lets the user open, rename-less switch, delete, or start a new chat,
 * and can be collapsed to a thin rail.
 */
export default function ChatHistorySidebar({
  open,
  onToggle,
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
}) {
  if (!open) {
    return (
      <div className="shrink-0 w-12 border-r border-slate-200 bg-white/85 backdrop-blur-md flex flex-col items-center gap-1.5 py-3">
        <button
          onClick={onToggle}
          title="Show chat history"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onNew}
          title="New chat"
          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <aside className="shrink-0 w-64 md:w-72 border-r border-slate-200 bg-white/90 backdrop-blur-md flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-200">
        <MessageSquare size={15} className="text-blue-600 shrink-0" />
        <p className="text-xs font-bold text-slate-800 flex-1 truncate">Chat History</p>
        <button
          onClick={onToggle}
          title="Hide chat history"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* New chat */}
      <div className="p-2.5 border-b border-slate-200">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-md"
        >
          <Plus size={14} /> New Chat
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5">
        {sessions.length === 0 && (
          <p className="text-[11px] text-slate-400 text-center pt-8 leading-relaxed">
            No past sessions yet.
            <br />
            Start a new conversation below.
          </p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group relative rounded-xl border transition-all ${
              activeId === session.id
                ? "bg-blue-50 border-blue-300"
                : "border-transparent hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            <button
              onClick={() => onSelect(session)}
              className="w-full text-left px-2.5 py-2 pr-8"
              title={session.sessionTitle || "Untitled chat"}
            >
              <p className="text-[11px] font-semibold text-slate-700 truncate">
                {session.sessionTitle || "Untitled chat"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock size={9} className="shrink-0" />
                {relTime(session.updatedAt)}
                {session.role ? ` · ${ROLE_SHORT[session.role] || session.role}` : ""}
                {session.messages?.length ? ` · ${session.messages.length} msgs` : ""}
              </p>
            </button>
            <button
              onClick={() => onDelete(session.id)}
              title="Delete session"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-slate-200">
        <p className="text-[10px] text-slate-400">
          Sessions saved locally on the MRPL server · Air-gapped
        </p>
      </div>
    </aside>
  );
}