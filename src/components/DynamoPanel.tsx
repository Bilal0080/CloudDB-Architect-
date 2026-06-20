import React, { useState } from "react";
import { DynamoDbBlueprint } from "../types";
import { Database, Copy, Check, Info, HelpCircle, Layers, Grid } from "lucide-react";

interface DynamoPanelProps {
  dynamoDb: DynamoDbBlueprint;
}

export default function DynamoPanel({ dynamoDb }: DynamoPanelProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [filterEntity, setFilterEntity] = useState<string>("ALL");

  const copyBlueprintJson = () => {
    navigator.clipboard.writeText(dynamoDb.sampleJson);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Parse lines or objects from sample json string to make them visually queryable
  let parsedEntities: any[] = [];
  try {
    const rawObj = JSON.parse(dynamoDb.sampleJson);
    if (rawObj.entities && Array.isArray(rawObj.entities)) {
      parsedEntities = rawObj.entities;
    } else if (Array.isArray(rawObj)) {
      parsedEntities = rawObj;
    } else {
      parsedEntities = [rawObj];
    }
  } catch (e) {
    // Fallback if parsing fails - split into simpler representation
    parsedEntities = [
      { PK: "USER#1", SK: "PROFILE", Name: "Bilal", Email: "host@mail.com" },
      { PK: "USER#1", SK: "ORDER#991", Created: "2026", Amount: 42.00 },
      { PK: "STORE#NEW", SK: "DETAILS", Address: "SaaS Cloud" }
    ];
  }

  // Deduplicate PK prefixes for filter tags (e.g. USER, PROD, ORDER)
  const filterTags = ["ALL", ...Array.from(new Set(parsedEntities.map(e => {
    if (typeof e.PK === "string") {
      return e.PK.split("#")[0] || "OTHER";
    }
    return "UNKNOWN";
  })))];

  const filteredEntities = filterEntity === "ALL" 
    ? parsedEntities 
    : parsedEntities.filter(e => typeof e.PK === "string" && e.PK.startsWith(filterEntity));

  return (
    <div className="space-y-6 text-slate-200">
      {/* Dynamic Key Metadata Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#141417] border border-white/10 rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-full text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">DynamoDB Table Name</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">{dynamoDb.tableName}</div>
          </div>
        </div>

        <div className="bg-[#141417] border border-white/10 rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Partition Key (PK)</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">{dynamoDb.primaryKey.partitionKey}</div>
          </div>
        </div>

        <div className="bg-[#141417] border border-white/10 rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Sort Key (SK)</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">{dynamoDb.primaryKey.sortKey}</div>
          </div>
        </div>
      </div>

      {/* Global Secondary Indexes (GSIs) Section */}
      <div className="bg-[#141417] border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">NoSQL Speed</span>
          <h4 className="text-sm font-semibold text-white">Global Secondary Indexes (GSIs)</h4>
        </div>

        {dynamoDb.gsis.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No secondary indexes declared for this workload.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/30 text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                <tr>
                  <th className="p-3 border-b border-white/10">GSI Index Name</th>
                  <th className="p-3 border-b border-white/10">Partition Key</th>
                  <th className="p-3 border-b border-white/10">Sort Key</th>
                  <th className="p-3 border-b border-white/10">Att. Projection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {dynamoDb.gsis.map((idx, index) => (
                  <tr key={index} className="hover:bg-white/5">
                    <td className="p-3 font-mono font-semibold text-white">{idx.indexName}</td>
                    <td className="p-3 font-mono text-cyan-400">{idx.partitionKey}</td>
                    <td className="p-3 font-mono text-purple-400">{idx.sortKey}</td>
                    <td className="p-3">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[10px] border border-white/10">
                        {idx.projection}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Access Patterns Mapping Grid */}
      <div className="bg-[#141417] border border-white/10 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span>Queryable Access Patterns Coverage</span>
          <span className="text-[10px] font-mono text-slate-400 bg-black/40 border border-white/10 px-1.5 py-0.5 rounded">
            All Queries map to Index lookups
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamoDb.accessPatterns.map((pat, index) => (
            <div key={index} className="bg-black/20 rounded-lg p-4 border border-white/5 sticky-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.2 rounded font-mono font-medium">Q{index + 1}</span>
                  <div className="text-xs font-semibold text-slate-200">{pat.action}</div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 font-mono bg-black/40 p-2 border border-white/5 rounded font-medium overflow-x-auto">
                  {pat.keyExpression}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-2.5 pt-2 border-t border-white/5 leading-relaxed italic">
                {pat.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphical Interactive Single-Table Item Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#141417] border border-white/10 rounded-xl p-5">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span>Living Single-Table Records Viewer</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                See how different system object classes coexist on the same single hardware partition.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
              {filterTags.map(tag => (
                <button
                  key={tag}
                  id={`tag-filter-${tag}`}
                  onClick={() => setFilterEntity(tag)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    filterEntity === tag 
                      ? "bg-amber-600 text-white font-medium shadow" 
                      : "text-slate-450 hover:text-white"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto rounded border border-white/10 bg-black/20">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-[#0E0E10] text-slate-450 text-[9px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-2.5">PK (partitionKey)</th>
                  <th className="p-2.5">SK (sortKey)</th>
                  <th className="p-2.5">Attributes Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntities.map((e, index) => {
                  const pkStr = String(e.PK || "");
                  const isUser = pkStr.startsWith("USER");
                  const isProduct = pkStr.startsWith("PROD") || pkStr.startsWith("SKU");
                  const isOrder = pkStr.startsWith("ORDER");
                  
                  // Visual color labels
                  let rowColor = "hover:bg-white/5";
                  let pkColor = "text-amber-500 font-bold";
                  if (isUser) {
                    rowColor = "bg-sky-500/5 hover:bg-sky-500/10";
                    pkColor = "text-cyan-400 font-bold";
                  } else if (isOrder) {
                     rowColor = "bg-purple-500/5 hover:bg-purple-500/10";
                     pkColor = "text-purple-400 font-bold";
                  } else if (isProduct) {
                    rowColor = "bg-amber-500/5 hover:bg-amber-500/10";
                    pkColor = "text-amber-400 font-bold";
                  }

                  // Strip PK & SK props to represent dynamic customized columns
                  const otherProps = { ...e };
                  delete otherProps.PK;
                  delete otherProps.SK;

                  return (
                    <tr key={index} className={`transition-colors ${rowColor}`}>
                      <td className={`p-2.5 border-r border-white/5 ${pkColor}`}>{e.PK || "---"}</td>
                      <td className="p-2.5 border-r border-white/5 text-purple-355 font-medium">{e.SK || "---"}</td>
                      <td className="p-2.5">
                        <div className="max-w-[450px] truncate text-slate-300">
                          {Object.entries(otherProps).map(([k, v]) => (
                            <span key={k} className="mr-2">
                              <span className="text-slate-500 font-medium">{k}:</span>
                              <span className="text-slate-200">
                                {typeof v === "object" ? JSON.stringify(v) : String(v)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Blueprint JSON Copy and AWS Strategy Column */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-[#0E0E10] rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-medium">Single-Table JSON Draft</span>
              <button
                id="copy-aws-json-btn"
                onClick={copyBlueprintJson}
                className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy full blueprint payload JSON"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="text-[10pt] font-mono text-slate-300 bg-black/40 p-3 rounded border border-white/5 overflow-y-auto max-h-[220px] custom-scrollbar scrollbar-thin">
              {dynamoDb.sampleJson}
            </pre>
          </div>

          <div className="bg-amber-950/10 border border-amber-900/60 rounded-lg p-4">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">Architect Tip: Design Keys Ahead</h5>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {dynamoDb.keyTips}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
