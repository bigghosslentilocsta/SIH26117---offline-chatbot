import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, AlertCircle, Volume2 } from "lucide-react";

/**
 * Field Technician sidebar widgets:
 *  - Push-to-record voice note (Web Speech API + MediaRecorder fallback)
 *  - High-contrast alert status (live from /api/refinery/alerts)
 *
 * `setVoiceText` pipes transcribed text into the chat input box.
 */
export default function FieldTechnicianWidgets({ onSend, setVoiceText }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [engine, setEngine] = useState(null);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive")
        mediaRecorderRef.current.stop();
    };
  }, []);

  // Fetch field alerts from backend
  useEffect(() => {
    let mounted = true;
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/refinery/alerts");
        if (res.ok) {
          const data = await res.json();
          if (mounted) setAlerts(data.alerts || []);
        }
      } catch {}
    };
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const startSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (ev) => {
      let final = "", interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final += t; else interim += t;
      }
      setTranscript(final || interim);
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed") { setError("Microphone permission denied."); setRecording(false); }
    };
    rec.onend = () => { if (recognitionRef.current) try { rec.start(); } catch {} };
    recognitionRef.current = rec;
    rec.start();
    setEngine("speech-api");
    return true;
  }, []);

  const startMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (!transcript) {
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const res = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audio_base64: reader.result.split(",")[1] }),
              });
              const data = await res.json();
              if (data.transcript) { setTranscript(data.transcript); if (setVoiceText) setVoiceText(data.transcript); }
            };
            reader.readAsDataURL(blob);
          } catch { setError("Transcription failed: backend unreachable"); }
        }
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setEngine("media-recorder");
      return true;
    } catch { setError("Microphone access denied or unavailable."); return false; }
  }, [transcript, setVoiceText]);

  const handleToggle = useCallback(async () => {
    if (recording) {
      setRecording(false);
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
      if (transcript && setVoiceText) setVoiceText(transcript);
    } else {
      setError(null); setTranscript(""); setRecording(true);
      if (!startSpeechRecognition()) await startMediaRecorder();
    }
  }, [recording, transcript, setVoiceText, startSpeechRecognition, startMediaRecorder]);

  return (
    <div className="space-y-3">
      {/* Push-to-Record Voice Note */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Voice Note Activator
        </p>
        <button onClick={handleToggle}
          className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm transition-all shadow-md ${
            recording ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" : "bg-amber-500 text-white hover:bg-amber-600"
          }`}>
          {recording ? <><MicOff size={18} /> Stop Recording</> : <><Mic size={18} /> Push to Record</>}
        </button>
        {recording && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Recording — tap to stop…
            </div>
            {engine && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Volume2 size={10} />
                {engine === "speech-api" ? "Web Speech API (offline)" : "MediaRecorder → backend STT"}
              </div>
            )}
          </div>
        )}
        {transcript && !recording && (
          <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-[10px] font-semibold text-blue-600 mb-1">Transcription:</p>
            <p className="text-[11px] text-blue-800">{transcript}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setTranscript("")}
                className="text-[10px] font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded bg-slate-100">Clear</button>
              <button onClick={() => { if (setVoiceText) setVoiceText(transcript); }}
                className="text-[10px] font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-100">Insert to Chat ↑</button>
            </div>
          </div>
        )}
        {error && <div className="mt-2 flex items-center gap-2 text-[10px] text-red-600"><AlertCircle size={12} /> {error}</div>}
      </div>

      {/* High-Contrast Alert Status */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Alert Status</p>
        <div className="space-y-2">
          {alerts.length === 0 && <p className="text-[10px] text-slate-400">No active alerts</p>}
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 ${alert.level === "warning" ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"}`}>
              <AlertCircle size={16} className={`shrink-0 ${alert.level === "warning" ? "text-amber-500" : "text-slate-400"}`} />
              <div className="min-w-0">
                <p className={`text-[11px] font-bold ${alert.level === "warning" ? "text-amber-800" : "text-slate-700"}`}>{alert.label}</p>
                <p className="text-[10px] text-slate-500">{alert.area}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
