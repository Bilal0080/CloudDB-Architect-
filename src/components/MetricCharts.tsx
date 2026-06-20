import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Play, Square, Zap, Server, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MetricChartsProps {
  initialReadRate: number;
  initialWriteRate: number;
  dbType: "dynamodb" | "aurora";
}

export default function MetricCharts({ initialReadRate, initialWriteRate, dbType }: MetricChartsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [dataPoints, setDataPoints] = useState<any[]>([]);

  // Generate initial static time series data
  useEffect(() => {
    const points = [];
    const baseReads = initialReadRate;
    const baseWrites = initialWriteRate;
    const now = new Date();

    for (let i = 15; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 5000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // DynamoDB math
      const reads = Math.max(10, Math.round(baseReads * (0.8 + Math.random() * 0.4)));
      const writes = Math.max(2, Math.round(baseWrites * (0.85 + Math.random() * 0.3)));
      const simulatedRcus = Math.max(5, Math.ceil((reads * 1.0) / 2));
      const simulatedWcus = Math.max(5, Math.ceil(writes * 1.0));

      // Aurora ACU math (Aurora Serverless scales from 0.5 to 16 ACUs)
      const calculatedLoad = (reads + writes * 5) / 1000;
      const simulatedAcus = parseFloat(Math.max(0.5, Math.min(16, 0.5 + calculatedLoad)).toFixed(2));

      points.push({
        time: timeStr,
        reads,
        writes,
        rcuProvisioned: simulatedRcus,
        wcuProvisioned: simulatedWcus,
        acusAllocated: simulatedAcus,
        latencyMs: Math.round(2 + Math.random() * 5),
      });
    }
    setDataPoints(points);
  }, [initialReadRate, initialWriteRate]);

  // Simulation tick logic when "Active Workload Simulator" is turned on
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const reads = Math.round(initialReadRate * multiplier * (0.7 + Math.random() * 0.6));
      const writes = Math.round(initialWriteRate * multiplier * (0.8 + Math.random() * 0.4));
      
      const simulatedRcus = Math.max(5, Math.ceil((reads * 1.2) / 2));
      const simulatedWcus = Math.max(5, Math.ceil(writes * 1.2));
      const calculatedLoad = (reads + writes * 6) / 1100;
      const simulatedAcus = parseFloat(Math.max(0.5, Math.min(16, 0.5 + calculatedLoad * Math.random())).toFixed(2));
      const latency = Math.round(dbType === "dynamodb" ? 1.5 + Math.random() * 3 : 3 + Math.random() * 6);

      setDataPoints((prev) => {
        const next = [...prev.slice(1)];
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        next.push({
          time: timeStr,
          reads,
          writes,
          rcuProvisioned: simulatedRcus,
          wcuProvisioned: simulatedWcus,
          acusAllocated: simulatedAcus,
          latencyMs: latency,
        });
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, multiplier, initialReadRate, initialWriteRate, dbType]);

  // Read current active metrics
  const lastPoint = dataPoints[dataPoints.length - 1] || { reads: 0, writes: 0, rcuProvisioned: 5, wcuProvisioned: 5, acusAllocated: 0.5, latencyMs: 3 };

  return (
    <motion.div
      key={`workload-board-${dbType}-${initialReadRate}-${initialWriteRate}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-[#141417] border border-white/10 rounded-xl p-5 mb-8 text-slate-100 shadow-2xl transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-lg font-semibold tracking-tight text-white">Active Workload Simulation Monitor</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Running simulated API operations over Vercel Serverless connections feeding to {dbType === "dynamodb" ? "Amazon DynamoDB" : "Amazon Aurora PostgreSQL"}.
          </p>
        </div>

        {/* Live Controller Commands */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="start-simulation-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
              isPlaying
                ? "bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> Pause Workload
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Run Traffic Simulator
              </>
            )}
          </button>

          {isPlaying && (
            <div className="flex items-center bg-[#0E0E10] border border-white/10 rounded-lg p-1">
              <span className="text-[10px] text-slate-400 px-2 font-mono">Load Factor:</span>
              <button
                id="load-factor-1x"
                onClick={() => setMultiplier(1)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  multiplier === 1 ? "bg-white/10 text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                1x
              </button>
              <button
                id="load-factor-2x"
                onClick={() => setMultiplier(2)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  multiplier === 2 ? "bg-amber-950 text-amber-400 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                2.5x Peak
              </button>
              <button
                id="load-factor-5x"
                onClick={() => setMultiplier(5)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  multiplier === 5 ? "bg-rose-950 text-rose-400 font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                5x Stress
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of living numerical telemetry values */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          key={`metric-reads-${lastPoint.reads}`}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-black/40 p-4 rounded-lg border border-white/5"
        >
          <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Simulated Traffic Reads</div>
          <div className="text-xl font-bold font-mono mt-1 text-cyan-400">{lastPoint.reads} / sec</div>
          <div className="text-[10px] text-slate-500 mt-1">Sustained API fetch operations</div>
        </motion.div>

        <motion.div
          key={`metric-writes-${lastPoint.writes}`}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-black/40 p-4 rounded-lg border border-white/5"
        >
          <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Simulated Traffic Writes</div>
          <div className="text-xl font-bold font-mono mt-1 text-purple-400">{lastPoint.writes} / sec</div>
          <div className="text-[10px] text-slate-500 mt-1">Sustained record mutations</div>
        </motion.div>

        {dbType === "dynamodb" ? (
          <motion.div
            key={`metric-scale-ddb-${lastPoint.rcuProvisioned}-${lastPoint.wcuProvisioned}`}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-black/40 p-4 rounded-lg border border-white/5"
          >
            <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">DynamoDB Scale (RCU / WCU)</div>
            <div className="text-xl font-bold font-mono mt-1 text-[#f59e0b]">
              {lastPoint.rcuProvisioned} <span className="text-xs text-slate-500">R</span> / {lastPoint.wcuProvisioned} <span className="text-xs text-slate-500">W</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">On-Demand calculated target RCU/WCU</div>
          </motion.div>
        ) : (
          <motion.div
            key={`metric-scale-aurora-${lastPoint.acusAllocated}`}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-black/40 p-4 rounded-lg border border-white/5"
          >
            <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Aurora Scale (ACUs Allocated)</div>
            <div className="text-xl font-bold font-mono mt-1 text-[#10b981]">
              {lastPoint.acusAllocated} <span className="text-xs text-slate-400 font-sans">AWS ACUs</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Auto-scales between 0.5 - 16 ACU capacities</div>
          </motion.div>
        )}

        <motion.div
          key={`metric-latency-${lastPoint.latencyMs}`}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-black/40 p-4 rounded-lg border border-white/5"
        >
          <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Client Roundtrip Latency</div>
          <div className="text-xl font-bold font-mono mt-1 text-emerald-400">{lastPoint.latencyMs} ms</div>
          <div className="text-[10px] text-slate-500 mt-1">Database response duration (Vercel-side)</div>
        </motion.div>
      </div>

      {/* Recharts Graphical Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Throughput (IOPS) Chart */}
        <motion.div
          key={`throughput-layer-${dbType}-${initialReadRate}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-black/20 p-3 rounded-lg border border-white/10"
        >
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Throughput Graph (Sustained load)</span>
            <span className="text-[10px] font-mono text-slate-500">Auto-refresh: 2s</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWrites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" stroke="#71717a" fontSize={9} />
                <YAxis stroke="#71717a" fontSize={9} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0E0E10", borderColor: "rgba(255,255,255,0.1)", color: "#f4f4f5" }}
                  labelStyle={{ fontSize: "10px", color: "#a1a1aa" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                <Area name="Read Ops/sec" type="monotone" dataKey="reads" stroke="#06b6d4" fillOpacity={1} fill="url(#colorReads)" strokeWidth={1.5} isAnimationActive={true} animationDuration={400} />
                <Area name="Write Ops/sec" type="monotone" dataKey="writes" stroke="#a855f7" fillOpacity={1} fill="url(#colorWrites)" strokeWidth={1.5} isAnimationActive={true} animationDuration={400} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Dynamic AWS Resource Scaling / Capacity allocation Chart */}
        <motion.div
          key={`scaling-layer-${dbType}-${initialWriteRate}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-black/20 p-3 rounded-lg border border-white/10"
        >
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {dbType === "dynamodb" ? "Provisioned RCU/WCU Scale Response" : "Aurora Serverless ACU Scale Allocation"}
            </span>
            <span className="text-[10px] text-teal-450 font-mono tracking-tight bg-[#0e0e10] border border-white/10 px-1.5 py-0.5 rounded">
              AWS Elastic scale active
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" stroke="#71717a" fontSize={9} />
                <YAxis stroke="#71717a" fontSize={9} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0E0E10", borderColor: "rgba(255,255,255,0.1)", color: "#f4f4f5" }}
                  labelStyle={{ fontSize: "10px", color: "#a1a1aa" }}
                />
                <Legend iconType="square" wrapperStyle={{ fontSize: "10px" }} />
                {dbType === "dynamodb" ? (
                  <>
                    <Line name="Provisioned RCU" type="step" dataKey="rcuProvisioned" stroke="#14b8a6" strokeWidth={1.5} dot={false} isAnimationActive={true} animationDuration={400} />
                    <Line name="Provisioned WCU" type="step" dataKey="wcuProvisioned" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={true} animationDuration={400} />
                  </>
                ) : (
                  <Line name="Active ACUs (Serverless)" type="monotone" dataKey="acusAllocated" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={400} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="relative overflow-hidden bg-black/40 border border-white/10 rounded-xl p-5 mt-5">
        <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full"></div>
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-300">
            <strong className="text-white block">Performance Insights for Hacks & Prototyping:</strong>
            {dbType === "dynamodb" ? (
              <span>
                DynamoDB easily handles immediate peaks without pre-allocation. Under <strong>On-Demand Mode (PAYG)</strong>, scale-up is virtually instantaneous. Under Vercel deployment, keep connection instances persistent outside global functions scope to achieve a warm-start latency profile of <strong>&lt;5 ms</strong>.
              </span>
            ) : (
              <span>
                Aurora Serverless v2 scales down to <strong>0.5 ACU</strong> when idle, minimizing base operating fees. Note that fast dynamic scaleups to handle sudden stress load take under <strong>3-5 seconds</strong>. Best practice: use Vercel Postgres pool limits of max ~10 connections to match Aurora.
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
