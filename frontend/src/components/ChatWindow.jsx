import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Bot, User, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function ChatWindow({
  messages,
  isLoading,
  messagesEndRef,
  autoScrollRef,
  currentRole,
  onSend,
  voiceText,
}) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Populate input when voice-to-text transcription arrives
  React.useEffect(() => {
    if (voiceText) {
      setInput((prev) => (prev ? prev + " " + voiceText : voiceText));
    }
  }, [voiceText]);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (autoScrollRef) autoScrollRef.current = atBottom;
    setShowScrollToBottom(!atBottom);
    setShowScrollToTop(el.scrollTop > 120);
  };

  const scrollToBottom = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    if (autoScrollRef) autoScrollRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const scrollToTop = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // If there are no messages, show the welcome hero
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-10 shadow-lg max-w-2xl pulse-glow">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 text-amber-400 shadow-xl">
              <Bot size={42} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome to MRPL AI Workbench
          </h2>
          <p className="text-slate-600 mb-6">
            {currentRole.icon} You are operating as{" "}
            <span className="font-semibold text-slate-800">
              {currentRole.name}
            </span>
          </p>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-left">
            <p className="text-sm text-slate-600 flex items-start gap-2">
              <Sparkles size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <span>
                This is a fully offline, air-gapped enterprise assistant. All
                AI processing happens locally via the Llama 3 model. Ask
                questions specific to your {currentRole.name.toLowerCase()}{" "}
                duties.
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Chat window with messages
  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
      {/* Message area - flex-1 + min-h-0 allows it to shrink and scroll */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="relative flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : msg.isError
                  ? "bg-red-50 border border-red-200 text-red-800 rounded-bl-md"
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {msg.role === "user" ? (
                  <User size={14} className={msg.role === "user" ? "text-blue-200" : "text-slate-400"} />
                ) : (
                  <Bot size={14} className="text-blue-600" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    msg.role === "user" ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {msg.role === "user" ? "You" : currentRole.name}
                </span>
                <span
                  className={`text-[10px] ${
                    msg.role === "user" ? "text-blue-200/70" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp} {msg.model ? `· ${msg.model}` : ""}
                </span>
              </div>

              {msg.role === "assistant" && !msg.isError ? (
                <div className="text-sm leading-relaxed chat-markdown">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[85%]">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-blue-600" />
                <span className="text-xs font-semibold text-slate-500 cursor-blink">
                  Thinking
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Scroll controls */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-2 z-10">
          {showScrollToTop && (
            <button
              onClick={scrollToTop}
              title="Scroll to top"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-900/85 text-white shadow-lg hover:bg-slate-700 transition-all cursor-pointer"
            >
              <ChevronUp size={18} />
            </button>
          )}
          {showScrollToBottom && (
            <button
              onClick={scrollToBottom}
              title="Jump to latest"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-all cursor-pointer animate-bounce-subtle"
            >
              <ChevronDown size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-slate-50/80">
        {/* Chat input */}
        <div className="p-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask as ${currentRole.name}... (Shift+Enter for new line)`}
              rows={1}
              className="flex-1 resize-none px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm text-slate-800 placeholder:text-slate-400 max-h-40"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-1.5 pl-1">
            Powered by local Llama 3 · Air-gapped · Data never leaves MRPL network
          </p>
        </div>
      </div>
    </div>
  );
}