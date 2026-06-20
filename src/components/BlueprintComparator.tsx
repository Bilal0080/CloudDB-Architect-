import React, { useState } from "react";
import { ArchitectResult } from "../types";
import { SCENARIO_PRESETS, PRESET_BLUEPRINTS } from "../data/presets";
import { Scale, TrendingUp, Zap, HelpCircle, ArrowRightLeft, Layers3, Server, Info, AlertCircle, Sparkles } from "lucide-react";

interface BlueprintComparatorProps {
  activeBlueprint: ArchitectResult;
}

export default function BlueprintComparator({ activeBlueprint }: BlueprintComparatorProps) {
  // We can let them select any preset OR the current active blueprint (including AI generated variations)
  const [refKeyA, setRefKeyA] = useState<string>("active");
  const [refKeyB, setRefKeyB] = useState<string>("b2b-multi-tenant");

  // Retrieve blueprint objects based on state configuration
  const getBlueprintObj = (key: string): ArchitectResult => {
    if (key === "active") {
      return activeBlueprint;
    }
    return PRESET_BLUEPRINTS[key] || PRESET_BLUEPRINTS["b2c-ecommerce"];
  };

  const getTitle = (key: string): string => {
    if (key === "active") {
      return "Current Active Design (Custom / AI Generated)";
    }
    const match = SCENARIO_PRESETS.find(p => p.id === key);
    return match ? match.title : key;
  };

  const bpA = getBlueprintObj(refKeyA);
  const bpB = getBlueprintObj(refKeyB);

  // Cost analysis helpers
  const dyA_cost = bpA.costEstimates.dynamodbMonthlyCost;
  const dyB_cost = bpB.costEstimates.dynamodbMonthlyCost;
  const auA_cost = bpA.costEstimates.auroraMonthlyCost;
  const auB_cost = bpB.costEstimates.auroraMonthlyCost;

  const dyDiff = Math.abs(dyA_cost - dyB_cost);
  const auDiff = Math.abs(auA_cost - auB_cost);

  return (
    <div className="space-y-6" id="blueprint-comparator-panel">
      {/* Selector Area */}
      <div className="bg-[#0E0E10] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="w-full md:w-5/12">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
            Draft Schema A (Left)
          </label>
          <select
            id="comparator-select-a"
            value={refKeyA}
            onChange={(e) => setRefKeyA(e.target.value)}
            className="w-full bg-[#18181B] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 font-sans"
          >
            <option value="active">✨ Current Active Design (AI / Manual)</option>
            {SCENARIO_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center bg-white/5 p-2 rounded-full border border-white/10">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="w-full md:w-5/12">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
            Draft Schema B (Right)
          </label>
          <select
            id="comparator-select-b"
            value={refKeyB}
            onChange={(e) => setRefKeyB(e.target.value)}
            className="w-full bg-[#18181B] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 font-sans"
          >
            <option value="active">✨ Current Active Design (AI / Manual)</option>
            {SCENARIO_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Draft A */}
        <div className="bg-[#18181C] border border-white/10 rounded-xl p-5 space-y-5 shadow-md">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <span className="text-[9px] font-bold font-mono text-emerald-400 uppercase tracking-widest">
                DRAFT ARCHITECTURE A
              </span>
              <h3 className="text-sm font-semibold text-white leading-tight mt-0.5">
                {getTitle(refKeyA)}
              </h3>
            </div>
          </div>

          {/* Quick Specs */}
          <div className="grid grid-cols-2 gap-2 bg-[#0E0E10] p-3 rounded-lg border border-white/5 text-xs text-slate-400 font-mono">
            <div>
              <span className="text-[9px] block text-slate-500 font-bold">DYNAMODB TABLE</span>
              <span className="text-white font-semibold truncate block mt-0.5">
                {bpA.dynamoDb.tableName}
              </span>
            </div>
            <div>
              <span className="text-[9px] block text-slate-500 font-bold">AURORA TABLES COUNT</span>
              <span className="text-white font-semibold block mt-0.5">
                {bpA.auroraPg.tables.length} tables
              </span>
            </div>
          </div>

          {/* Cost Estimates card for A */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-wider font-bold uppercase text-slate-400 block">
              1. Monthly AWS Infrastructure Estimates
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0E0E10] p-3.5 rounded-lg border border-white/10">
                <span className="text-[9px] text-slate-500 font-bold uppercase block font-mono">DynamoDB PAYG</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">
                  ${dyA_cost.toFixed(2)}
                </span>
                {dyA_cost < dyB_cost ? (
                  <span className="text-[10px] text-green-400 font-medium font-mono block mt-1.5 bg-green-950/40 border border-green-900/40 px-1.5 py-0.5 rounded text-center">
                    Cheaper by ${dyDiff.toFixed(2)} /mo
                  </span>
                ) : dyA_cost > dyB_cost ? (
                  <span className="text-[10px] text-red-400 font-medium font-mono block mt-1.5 bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded text-center">
                    More expensive by ${dyDiff.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 block mt-1.5 font-mono text-center">Identical</span>
                )}
              </div>

              <div className="bg-[#0E0E10] p-3.5 rounded-lg border border-white/10">
                <span className="text-[9px] text-slate-500 font-bold uppercase block font-mono">Aurora Pg (ACUs)</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">
                  ${auA_cost.toFixed(2)}
                </span>
                {auA_cost < auB_cost ? (
                  <span className="text-[10px] text-green-400 font-medium font-mono block mt-1.5 bg-green-950/40 border border-green-900/40 px-1.5 py-0.5 rounded text-center">
                    Cheaper by ${auDiff.toFixed(2)} /mo
                  </span>
                ) : auA_cost > auB_cost ? (
                  <span className="text-[10px] text-red-400 font-medium font-mono block mt-1.5 bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded text-center">
                    More expensive by ${auDiff.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 block mt-1.5 font-mono text-center">Identical</span>
                )}
              </div>
            </div>
          </div>

          {/* DynamoDB Schema & Primary Keys A */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-wider font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Layers3 className="w-3.5 h-3.5 text-indigo-400" /> DynamoDB Schema Configuration
            </span>
            <div className="bg-[#0E0E10] p-3.5 rounded-lg border border-white/10 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase block font-mono">Partition Key (PK)</span>
                  <span className="font-mono text-white text-[11px] font-bold block bg-white/5 p-1.5 rounded mt-1 border border-white/5">
                    {bpA.dynamoDb.primaryKey.partitionKey}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase block font-mono">Sort Key (SK)</span>
                  <span className="font-mono text-white text-[11px] font-bold block bg-white/5 p-1.5 rounded mt-1 border border-white/5">
                    {bpA.dynamoDb.primaryKey.sortKey}
                  </span>
                </div>
              </div>

              {/* GSIs count */}
              <div>
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-1">
                  Global Secondary Indexes (GSIs): {bpA.dynamoDb.gsis.length}
                </span>
                {bpA.dynamoDb.gsis.length > 0 ? (
                  <div className="space-y-1">
                    {bpA.dynamoDb.gsis.map((idx, index) => (
                      <div key={index} className="text-[10px] font-mono bg-white/5 p-2 rounded flex justify-between text-slate-300">
                        <span className="font-bold text-slate-200">{idx.indexName}</span>
                        <span>PK: {idx.partitionKey} | SK: {idx.sortKey}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 block italic">No GSIs defined for basic index lookup.</span>
                )}
              </div>
            </div>
          </div>

          {/* Aurora PostgreSQL Tables A */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-wider font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" /> Relational SQL Schema & Indexing
            </span>
            <div className="bg-[#0E0E10] p-3.5 rounded-lg border border-white/10 space-y-3">
              <div className="space-y-2">
                {bpA.auroraPg.tables.map((tbl, index) => (
                  <div key={index} className="bg-white/5 p-2.5 rounded border border-white/5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                        {tbl.name}
                      </span>
                      <span className="text-[8px] text-slate-400 bg-white/5 px-1 py-0.5 font-mono rounded">
                        {tbl.columns.length} columns
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mb-1">
                      {tbl.columns.slice(0, 3).map(c => c.split(" ")[0]).join(", ")}
                      {tbl.columns.length > 3 && " ..."}
                    </div>
                    <div className="text-[8.5px] font-mono text-indigo-300 italic">
                      Index model: {tbl.keysAndIndexes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Draft B */}
        <div className="bg-[#18181C] border border-white/10 rounded-xl p-5 space-y-5 shadow-md">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <div>
              <span className="text-[9px] font-bold font-mono text-indigo-400 uppercase tracking-widest">
                DRAFT ARCHITECTURE B
              </span>
              <h3 className="text-sm font-semibold text-white leading-tight mt-0.5">
                {getTitle(refKeyB)}
              </h3>
            </div>
          </div>

          {/* Quick Specs */}
          <div className="grid grid-cols-2 gap-2 bg-[#0E0E10] p-3 rounded-lg border border-white/5 text-xs text-slate-400 font-mono">
            <div>
              <span className="text-[9px] block text-slate-500 font-bold">DYNAMODB TABLE</span>
              <span className="text-white font-semibold truncate block mt-0.5">
                {bpB.dynamoDb.tableName}
              </span>
            </div>
            <div>
              <span className="text-[9px] block text-slate-500 font-bold">AURORA TABLES COUNT</span>
              <span className="text-white font-semibold block mt-0.5">
                {bpB.auroraPg.tables.length} tables
              </span>
            </div>
          </div>

          {/* Cost Estimates card for B */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-wider font-bold uppercase text-slate-400 block">
              1. Monthly AWS Infrastructure Estimates
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0E0E10] p-3.5 rounded-lg border border-white/10">
                <span className="text-[9px] text-slate-500 font-bold uppercase block font-mono">DynamoDB PAYG</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">
                  ${dyB_cost.toFixed(2)}
                </span>
                {dyB_cost < dyA_cost ? (
                  <span className="text-[10px] text-green-400 font-medium font-mono block mt-1.5 bg-green-950/40 border border-green-900/40 px-1.5 py-0.5 rounded text-center">
                    Cheaper by ${dyDiff.toFixed(2)} /mo
                  </span>
                ) : dyB_cost > dyA_cost ? (
                  <span className="text-[10px] text-red-400 font-medium font-mono block mt-1.5 bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded text-center">
                    More expensive by ${dyDiff.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 block mt-1.5 font-mono text-center">Identical</span>
                )}
              </div>

              <div className="bg-[#0E0E10] p-3.5 rounded-lg border border-white/10">
                <span className="text-[9px] text-slate-500 font-bold uppercase block font-mono">Aurora Pg (ACUs)</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">
                  ${auB_cost.toFixed(2)}
                </span>
                {auB_cost < auA_cost ? (
                  <span className="text-[10px] text-green-400 font-medium font-mono block mt-1.5 bg-green-950/40 border border-green-900/40 px-1.5 py-0.5 rounded text-center">
                    Cheaper by ${auDiff.toFixed(2)} /mo
                  </span>
                ) : auB_cost > auA_cost ? (
                  <span className="text-[10px] text-red-400 font-medium font-mono block mt-1.5 bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded text-center">
                    More expensive by ${auDiff.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 block mt-1.5 font-mono text-center">Identical</span>
                )}
              </div>
            </div>
          </div>

          {/* DynamoDB Schema & Primary Keys B */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-wider font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Layers3 className="w-3.5 h-3.5 text-indigo-400" /> DynamoDB Schema Configuration
            </span>
            <div className="bg-[#0E0E10] p-3.5 rounded-lg border border-white/10 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase block font-mono">Partition Key (PK)</span>
                  <span className="font-mono text-white text-[11px] font-bold block bg-white/5 p-1.5 rounded mt-1 border border-white/5">
                    {bpB.dynamoDb.primaryKey.partitionKey}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-bold uppercase block font-mono">Sort Key (SK)</span>
                  <span className="font-mono text-white text-[11px] font-bold block bg-white/5 p-1.5 rounded mt-1 border border-white/5">
                    {bpB.dynamoDb.primaryKey.sortKey}
                  </span>
                </div>
              </div>

              {/* GSIs count */}
              <div>
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-1">
                  Global Secondary Indexes (GSIs): {bpB.dynamoDb.gsis.length}
                </span>
                {bpB.dynamoDb.gsis.length > 0 ? (
                  <div className="space-y-1">
                    {bpB.dynamoDb.gsis.map((idx, index) => (
                      <div key={index} className="text-[10px] font-mono bg-white/5 p-2 rounded flex justify-between text-slate-300">
                        <span className="font-bold text-slate-200">{idx.indexName}</span>
                        <span>PK: {idx.partitionKey} | SK: {idx.sortKey}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 block italic">No GSIs defined for basic index lookup.</span>
                )}
              </div>
            </div>
          </div>

          {/* Aurora PostgreSQL Tables B */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-wider font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" /> Relational SQL Schema & Indexing
            </span>
            <div className="bg-[#0E0E10] p-3.5 rounded-lg border border-white/10 space-y-3">
              <div className="space-y-2">
                {bpB.auroraPg.tables.map((tbl, index) => (
                  <div key={index} className="bg-white/5 p-2.5 rounded border border-white/5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                        {tbl.name}
                      </span>
                      <span className="text-[8px] text-slate-400 bg-white/5 px-1 py-0.5 font-mono rounded">
                        {tbl.columns.length} columns
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mb-1">
                      {tbl.columns.slice(0, 3).map(c => c.split(" ")[0]).join(", ")}
                      {tbl.columns.length > 3 && " ..."}
                    </div>
                    <div className="text-[8.5px] font-mono text-indigo-300 italic">
                      Index model: {tbl.keysAndIndexes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights & Paradigm Verdict */}
      <div className="bg-[#141417] border border-white/10 rounded-xl p-5 shadow-lg space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <Sparkles className="w-4 h-4 text-amber-400" /> Architecture Highlights & Key Decisions
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#0E0E10] border border-white/5 p-3 rounded-lg leading-relaxed space-y-1.5">
            <div className="font-bold text-slate-300 font-mono flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-emerald-400" /> Cost Difference Analysis
            </div>
            <p className="text-slate-400">
              Draft A monthly DynamoDB cost is <strong>${dyA_cost.toFixed(2)}</strong> and Aurora PostgreSQL cost is <strong>${auA_cost.toFixed(2)}</strong>.
              Comparing drafts side-by-side, Draft {dyA_cost < dyB_cost ? "A" : "B"} saves you the most on serverless key-value setups (difference of <strong>${dyDiff.toFixed(2)}/mo</strong>),
              while Draft {auA_cost < auB_cost ? "A" : "B"} minimizes the base relational host ACU requirements (saving <strong>${auDiff.toFixed(2)}/mo</strong>).
            </p>
          </div>

          <div className="bg-[#0E0E10] border border-white/5 p-3 rounded-lg leading-relaxed space-y-1.5">
            <div className="font-bold text-slate-300 font-mono flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> Indexing Alignment Assessment
            </div>
            <p className="text-slate-400">
              Draft A partitions DynamoDB traffic with <strong>{bpA.dynamoDb.primaryKey.partitionKey}</strong>, deploying <strong>{bpA.dynamoDb.gsis.length} secondary indexes</strong>.
              Draft B leverages <strong>{bpB.dynamoDb.primaryKey.partitionKey}</strong> layout.
              In PostgreSQL, Draft A runs a normalized model of <strong>{bpA.auroraPg.tables.length} tables</strong> while Draft B runs <strong>{bpB.auroraPg.tables.length} tables</strong>. Indexing strategies are designed for specific access direction lookups, keeping RAM usage optimized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
