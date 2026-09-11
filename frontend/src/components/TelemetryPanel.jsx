import React, { useState, useEffect } from "react";
import {
  Cpu,
  HardDrive,
  Zap,
  X,
  Activity,
  Clock,
  RefreshCw,
  Gauge,
} from "lucide-react";

export default function TelemetryPanel({ onClose }) {
  const [data, setData] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchTelemetry = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/telemetry");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (mounted) {
          setData(json);
          setError(false);
        }
      } catch (e) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshTick]);

  const formatUptime = (secs) => {
    if (!secs) return "0s";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const StatCard = ({ icon, label, value, unit, color }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {React.cloneElement(icon, { size: 14, className: color })}
        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
          {label}
        </p>
      </div>
      <p className="text-xl font-bold text-slate-900">
        {value}
        <span className="text-xs font-medium text-slate-400 ml-0.5">
          {unit}
        </span>
      </p>
    </div>
  );

  return (
    <div className="w-80 shrink-0 flex flex-col gap-4 p-4 overflow-y-auto border-l border-slate-200 bg-white/60 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">
            System Telemetry
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRefreshTick((t) => t + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-red-700 mb-1">
            Telemetry unavailable
          </p>
          <p className="text-xs text-red-600/70">
            Backend service not reachable
          </p>
          <button
            onClick={() => setRefreshTick((t) => t + 1)}
            className="mt-3 px-3 py-1.5 bg-red-100 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400">Loading telemetry...</p>
        </div>
      ) : (
        <>
          {/* Model Status */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-800">
                Model Loaded
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {data.model_loaded}
              </span>
            </div>
          </div>

          {/* GPU / VRAM */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Gauge size={14} className="text-blue-500" />
              GPU & Memory
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>VRAM Usage</span>
                  <span className="font-semibold text-slate-700">
                    {data.vram_used_gb} / {data.vram_total_gb} GB
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(data.vram_percent, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {data.vram_percent}% utilized
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>GPU Utilization</span>
                  <span className="font-semibold text-slate-700">
                    {data.gpu_utilization}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${data.gpu_utilization}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<Zap />}
              label="Tokens/sec"
              value={data.tokens_per_second}
              unit="t/s"
              color="text-amber-500"
            />
            <StatCard
              icon={<Activity />}
              label="Active Reqs"
              value={data.active_requests}
              unit=""
              color="text-blue-500"
            />
            <StatCard
              icon={<HardDrive />}
              label="VRAM Free"
              value={Number(data.vram_total_gb - data.vram_used_gb).toFixed(1)}
              unit="GB"
              color="text-emerald-500"
            />
            <StatCard
              icon={<Clock />}
              label="Uptime"
              value={formatUptime(data.uptime_seconds)}
              unit=""
              color="text-slate-500"
            />
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            Auto-refreshing every 5s
          </p>
        </>
      )}
    </div>
  );
}