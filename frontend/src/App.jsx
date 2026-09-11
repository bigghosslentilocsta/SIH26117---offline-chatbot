import React, { useState, useRef, useEffect, useCallback } from "react";
import { ROLES } from "./roles.js";
import Navbar from "./components/Navbar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import QuickPrompts from "./components/QuickPrompts.jsx";
import TelemetryPanel from "./components/TelemetryPanel.jsx";
import Sidebar from "./components/Sidebar.jsx";
import RolePanels from "./components/RolePanels.jsx";
import LoginScreen from "./components/LoginScreen.jsx";

/* ── Helpers: JWT session persistence ── */
function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function resolveRole(user) {
  if (!user || !user.role) return ROLES[0];
  return ROLES.find((r) => r.id === user.role) || ROLES[0];
}

export default function App() {
  /* ── Auth state ── */
  const [authToken, setAuthToken] = useState(() => {
    const t = localStorage.getItem("token");
    return isTokenValid(t) ? t : null;
  });
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  /* ── Derived role from user profile ── */
  const currentRole = resolveRole(user);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const messagesEndRef = useRef(null);
  const autoScrollRef = useRef(true);

  /* ── Auth handlers ── */
  const handleLogin = useCallback((token, userData) => {
    setAuthToken(token);
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
    setMessages([]);
    setIsLoading(false);
    setShowTelemetry(false);
  }, []);

  /* ── Redirect to login if unauthenticated ── */
  if (!authToken || !isTokenValid(authToken)) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (autoScrollRef.current) scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading) return;

      const userMessage = {
        id: Date.now(),
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ prompt: text, role: currentRole.name }),
        });

        if (res.status === 401) {
          handleLogout();
          return;
        }

        // Reserve an empty assistant bubble that fills in live as tokens stream in
        const aiMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: "",
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        const reader = res.body?.getReader();
        if (!reader) {
          // Fallback for non-streaming responses (proxies that may buffer)
          const data = await res.json();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessage.id
                ? { ...m, content: data.response || "", model: data.model }
                : m
            )
          );
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let chunk;
            try {
              chunk = JSON.parse(line);
            } catch {
              continue;
            }
            if (chunk.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessage.id
                    ? { ...m, content: chunk.error, isError: true }
                    : m
                )
              );
            } else if (chunk.delta) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessage.id
                    ? { ...m, content: m.content + chunk.delta, model: chunk.model || m.model }
                    : m
                )
              );
            }
          }
        }
      } catch (err) {
        const errorMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "⚠️ Connection error. Please verify the backend service is running.",
          timestamp: new Date().toLocaleTimeString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentRole, isLoading, authToken, handleLogout]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* MRPL Refinery Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/id987-pOUO.webp"
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        {/* 70% white overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(248, 250, 252, 0.70)" }}
        />
        {/* Subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/30 via-transparent to-blue-50/20" />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col h-screen">
        <Navbar
          currentRole={currentRole}
          user={user}
          onLogout={handleLogout}
          showTelemetry={showTelemetry}
          setShowTelemetry={setShowTelemetry}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          messageCount={messages.length}
          onClearChat={clearChat}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <Sidebar
              currentRole={currentRole}
              user={user}
              messages={messages}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onSend={sendMessage}
              setVoiceText={setVoiceText}
            />
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatWindow
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
                autoScrollRef={autoScrollRef}
                currentRole={currentRole}
                onSend={sendMessage}
                voiceText={voiceText}
              />
            </div>

            {/* Quick Prompts - only show when no messages */}
            {messages.length === 0 && (
              <QuickPrompts
                currentRole={currentRole}
                onSend={sendMessage}
              />
            )}
          </div>

          {/* Role-Specific Dashboard Panels */}
          <RolePanels currentRole={currentRole} onSend={sendMessage} authToken={authToken} />

          {/* Telemetry Panel */}
          {showTelemetry && (
            <TelemetryPanel onClose={() => setShowTelemetry(false)} />
          )}
        </div>
      </div>
    </div>
  );
}