import React, { useState, useRef, useEffect, useCallback } from "react";
import { ROLES } from "./roles.js";
import Navbar from "./components/Navbar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import Sidebar from "./components/Sidebar.jsx";
import RolePanels from "./components/RolePanels.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import ChatHistorySidebar from "./components/ChatHistorySidebar.jsx";
import ProfileModal from "./components/ProfileModal.jsx";
import DashboardPage from "./components/pages/DashboardPage.jsx";
import UserManagementPage from "./components/pages/UserManagementPage.jsx";
import AuditLogsPage from "./components/pages/AuditLogsPage.jsx";
import SettingsPage from "./components/pages/SettingsPage.jsx";

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

/** Derive a descriptive chat session title from the first user message. */
function deriveTitle(text) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned.length > 48 ? `${cleaned.slice(0, 48)}…` : cleaned;
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

  /* ── Navigation + page state ── */
  const [activePage, setActivePage] = useState("dashboard");
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* ── Chat state ── */
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentTitle, setCurrentTitle] = useState("New Chat");
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef(null);
  const autoScrollRef = useRef(true);
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* ── Chat session persistence ── */
  const loadChatHistory = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) setChatHistory(await res.json());
    } catch {
      /* keep existing list on failure */
    }
  }, [authToken]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  /* ── Auth handlers ── */
  const handleLogin = useCallback((token, userData) => {
    setAuthToken(token);
    setUser(userData);
    setActivePage("dashboard");
    setMessages([]);
    setCurrentChatId(null);
    setCurrentTitle("New Chat");
    setShowProfile(false);
    setChatHistory([]);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
    setMessages([]);
    setChatHistory([]);
    setCurrentChatId(null);
    setCurrentTitle("New Chat");
    setIsLoading(false);
    setShowTelemetry(false);
    setShowProfile(false);
  }, []);

  /* ── Navigation ── */
  const navigate = useCallback((page) => setActivePage(page), []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    setCurrentTitle("New Chat");
    setActivePage("chatbot");
  }, []);

  const openChatSession = useCallback((session) => {
    const msgs = (session.messages || []).map((m, i) => ({
      id: `${session.id}-${i}-${Date.now()}`,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
        ? new Date(m.timestamp).toLocaleTimeString()
        : new Date().toLocaleTimeString(),
      model: m.model,
      isError: false,
    }));
    setMessages(msgs);
    setCurrentChatId(session.id);
    setCurrentTitle(session.sessionTitle || "New Chat");
    setActivePage("chatbot");
  }, []);

  const deleteChatSession = useCallback(
    async (sessionId) => {
      try {
        await fetch(`/api/chats/${sessionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        /* ignore */
      }
      if (currentChatId === sessionId) startNewChat();
      await loadChatHistory();
    },
    [authToken, currentChatId, loadChatHistory, startNewChat]
  );

  const persistChat = useCallback(
    async (chatId, title, msgs) => {
      const payload = {
        role: currentRole.id,
        sessionTitle: title,
        messages: msgs.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
          model: m.model || null,
        })),
      };
      const opts = {
        method: chatId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      };
      const res = await fetch(chatId ? `/api/chats/${chatId}` : "/api/chats", opts);
      if (res.ok) {
        const created = await res.json();
        if (!chatId) {
          setCurrentChatId(created.id);
          setCurrentTitle(created.sessionTitle);
        }
      }
    },
    [authToken, currentRole.id]
  );
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
      const seeded = [...messagesRef.current, userMessage];
      setMessages(seeded);
      setIsLoading(true);

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      let chatId = currentChatId;
      const title =
        messagesRef.current.length === 0 ? deriveTitle(text) : currentTitle;
      let assistantText = "";
      let assistantModel = null;
      let streamError = false;

      try {
        // Create a chat session when the first message of a conversation is sent
        if (!chatId) {
          const res = await fetch("/api/chats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              role: currentRole.id,
              sessionTitle: title,
              messages: [
                { role: "user", content: text, timestamp: new Date().toISOString() },
              ],
            }),
          });
          if (res.ok) {
            const created = await res.json();
            chatId = created.id;
            setCurrentChatId(chatId);
            setCurrentTitle(created.sessionTitle);
          }
        }

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

        const reader = res.body?.getReader();
        if (!reader) {
          // Fallback for non-streaming responses (proxies that may buffer)
          const data = await res.json();
          assistantText = data.response || "";
          assistantModel = data.model || null;
          if (!assistantText) streamError = true;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessage.id ? { ...m, content: assistantText, model: assistantModel } : m
            )
          );
        } else {
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
                streamError = true;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessage.id
                      ? { ...m, content: chunk.error, isError: true }
                      : m
                  )
                );
              } else if (chunk.delta) {
                assistantText += chunk.delta;
                assistantModel = chunk.model || assistantModel;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessage.id
                      ? { ...m, content: assistantText, model: assistantModel }
                      : m
                  )
                );
              }
            }
          }
        }

        // Persist the completed exchange (only when a session exists & no error)
        if (chatId && !streamError) {
          const finalMsgs = [
            ...seeded,
            { ...aiMessage, content: assistantText, model: assistantModel },
          ];
          await persistChat(chatId, title, finalMsgs);
          await loadChatHistory();
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content:
              "⚠️ Connection error. Please verify the backend service is running.",
            timestamp: new Date().toLocaleTimeString(),
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentRole,
      isLoading,
      authToken,
      handleLogout,
      currentChatId,
      currentTitle,
      persistChat,
      loadChatHistory,
    ]
  );

  const clearChat = useCallback(() => setMessages([]), []);

  if (!authToken || !isTokenValid(authToken)) {
    return <LoginScreen onLogin={handleLogin} />;
  }
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
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(248, 250, 252, 0.70)" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/30 via-transparent to-blue-50/20" />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col h-screen">
        <Navbar
          currentRole={currentRole}
          user={user}
          onOpenProfile={() => setShowProfile(true)}
          showTelemetry={showTelemetry}
          setShowTelemetry={setShowTelemetry}
          messageCount={messages.length}
          onClearChat={clearChat}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            currentRole={currentRole}
            user={user}
            activePage={activePage}
            onNavigate={navigate}
            onOpenProfile={() => setShowProfile(true)}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main content area */}
          <main className="flex-1 min-w-0 overflow-hidden">
            {activePage === "dashboard" && (
              <DashboardPage currentRole={currentRole} onNavigate={navigate} onStartChat={startNewChat} />
            )}

            {activePage === "chatbot" && (
              <div className="flex h-full">
                <ChatHistorySidebar
                  open={chatHistoryOpen}
                  onToggle={() => setChatHistoryOpen(!chatHistoryOpen)}
                  sessions={chatHistory}
                  activeId={currentChatId}
                  onSelect={openChatSession}
                  onNew={startNewChat}
                  onDelete={deleteChatSession}
                />
                <div className="flex-1 min-w-0 flex flex-col">
                  <ChatWindow
                    messages={messages}
                    isLoading={isLoading}
                    messagesEndRef={messagesEndRef}
                    autoScrollRef={autoScrollRef}
                    currentRole={currentRole}
                    onSend={sendMessage}
                    voiceText={voiceText}
                    fullscreen
                    title={currentTitle}
                    onNewChat={startNewChat}
                    onToggleHistory={() => setChatHistoryOpen(!chatHistoryOpen)}
                    historyOpen={chatHistoryOpen}
                  />
                </div>
              </div>
            )}

            {activePage === "user-management" && (
              <UserManagementPage currentUser={user} />
            )}

            {activePage === "audit-logs" && <AuditLogsPage />}

            {activePage === "settings" && (
              <SettingsPage user={user} currentRole={currentRole} />
            )}
          </main>

          {/* Role-specific dashboard strip (Dashboard only so Chatbot stays full-screen) */}
          {activePage === "dashboard" && (
            <RolePanels currentRole={currentRole} onSend={sendMessage} authToken={authToken} />
          )}

          {/* Telemetry Panel */}
          {showTelemetry && (
            <TelemetryPanel onClose={() => setShowTelemetry(false)} />
          )}
        </div>
      </div>

      {/* Profile management modal opened from the avatar */}
      {showProfile && (
        <ProfileModal user={user} currentRole={currentRole} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}