import React, { useState } from "react";
import { OptimizerResult } from "../types";
import { Wrench, Zap, Check, AlertTriangle, Cpu, Loader2 } from "lucide-react";

export default function OptimizationConsole() {
  const [schemaType, setSchemaType] = useState<string>("DynamoDB Single-Table");
  const [customModelText, setCustomModelText] = useState<string>(
    `PK: USER#<userId> | SK: PROFILE
PK: USER#<userId> | SK: ORDER#<orderId> | Status: PENDING
PK: PRODUCT#<sku> | SK: METADATA

We run a daily query to find all orders across the entire database that are currently stuck in 'PENDING'. Currently we have to perform a costly SCAN with a custom filter.`
  );
  const [queryToOptimize, setQueryToOptimize] = useState<string>(
    "Find all order objects with Status = 'PENDING' without executing table Scans."
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [result, setResult] = useState<OptimizerResult | null>({
    analysis: "Pasting simple access-scans requires a full cluster scan across unrelated records (USER summaries and PRODUCT metadata). This severely limits throughput as the dataset reaches million-scale ratios.",
    proposedFixes: [
      "Create a Global Secondary Index (GSI) isolating status and timestamp attributes.",
      "Filter the query specifically targeting GSI partition indices.",
      "Avoid reading non-order SK values during status search stages."
    ],
    ddlOrIndexOutput: `{
  "IndexName": "GSI_OrderStatus_Lookup",
  "KeySchema": [
    { "AttributeName": "Status", "KeyType": "HASH" },
    { "AttributeName": "SK", "KeyType": "RANGE" }
  ],
  "Projection": {
    "ProjectionType": "INCLUDE",
    "NonKeyAttributes": ["TotalAmount", "CreatedDate"]
  }
}`,
    iopsEstimateBenefit: "Reduces throughput read consumption from O(N) table scale to O(1) point indexes. Latencies decrease by 98.4%."
  });

  const runOptimizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModelText.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaType,
          customModelText,
          queryToOptimize
        })
      });

      if (!response.ok) {
        throw new Error("Tuning optimization failed to parse content.");
      }

      const data: OptimizerResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Unable to contact Gemini optimizer service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#141417] border border-white/10 rounded-xl p-5 text-slate-100 shadow-2xl">
      <div className="border-b border-white/10 pb-4 mb-5">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-yellow-400" />
          <span>Gemini AI Performance Optimizer Sandbox</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Perform live index tuning, hot partition avoidance strategies, and SQL optimization recommendations for cloud deployments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Configuration Column */}
        <form onSubmit={runOptimizer} className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Target DB Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["DynamoDB Single-Table", "Aurora PostgreSQL"].map(type => (
                <button
                  type="button"
                  key={type}
                  id={`opt-engine-${type.replace(/\s+/g, "-")}`}
                  onClick={() => setSchemaType(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                    schemaType === type
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Active Schema Blueprint / Entity Keys
            </label>
            <textarea
              id="opt-schema-input"
              value={customModelText}
              onChange={(e) => setCustomModelText(e.target.value)}
              className="w-full h-32 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-white/25 focus:bg-black/60"
              placeholder="Paste PK/SK layouts or SQL schemas..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Describe Bottleneck / Slow Query Pattern
            </label>
            <input
              id="opt-query-input"
              type="text"
              value={queryToOptimize}
              onChange={(e) => setQueryToOptimize(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-white/25 focus:bg-black/60 font-medium"
              placeholder="E.g. Get top orders above $500 sorted chronologically"
            />
          </div>

          <button
            type="submit"
            id="run-optimize-btn"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-200 disabled:bg-white/10 disabled:text-slate-550 text-black rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching AI Optimizations...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current animate-pulse" /> Optimize DB Schema
              </>
            )}
          </button>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-900/60 p-3 rounded text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        {/* Output Tuning Results Column */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="space-y-4">
              <div className="bg-[#0E0E10] rounded-lg p-4 border border-white/10">
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#eab308] font-bold mb-1">
                  AI Structural Diagnostics
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1.5">
                  {result.analysis}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-medium mb-2.5">
                    Recommended Steps
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 font-medium">
                    {result.proposedFixes.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-white">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-305 font-bold">
                      Calculated IOPS Optimization
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans leading-relaxed italic">
                    {result.iopsEstimateBenefit}
                  </p>
                </div>
              </div>

              <div className="bg-[#0E0E10] rounded-lg border border-white/10 p-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-2">
                  Optimization DDL / Index Blueprint Script
                </div>
                <pre className="text-[11px] font-mono text-slate-300 bg-black/40 p-3 rounded border border-white/5 overflow-x-auto max-h-[140px] leading-relaxed custom-scrollbar text-slate-300">
                  {result.ddlOrIndexOutput}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/15 rounded-lg p-10 text-center grayscale opacity-60">
              <AlertTriangle className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-xs text-slate-400 font-mono">Input your bottleneck context and click run to analyze.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
