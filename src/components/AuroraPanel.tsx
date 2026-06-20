import React, { useState } from "react";
import { AuroraPgBlueprint } from "../types";
import { Table, Copy, Check, FileText, Settings, ShieldAlert, Cpu } from "lucide-react";

interface AuroraPanelProps {
  auroraPg: AuroraPgBlueprint;
}

export default function AuroraPanel({ auroraPg }: AuroraPanelProps) {
  const [copiedSql, setCopiedSql] = useState(false);

  const copySqlDdl = () => {
    navigator.clipboard.writeText(auroraPg.ddlSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Table Columns Mapping Cards */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span>Relational Schema Columns Mapper</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 rounded">
            Postgres DDL aligned with SQL Standard
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {auroraPg.tables.map((tbl, index) => (
            <div key={index} className="bg-[#141417] border border-white/10 rounded-xl p-4 flex flex-col justify-between sticky-hover">
              <div>
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white font-mono">{tbl.name}</span>
                </div>

                <div className="space-y-1.5 h-[130px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/15 pr-1 text-slate-100">
                  {tbl.columns.map((col, cIdx) => (
                    <div key={cIdx} className="flex justify-between items-center text-[10.5px] bg-black/40 p-1.5 rounded font-mono border border-white/5 text-slate-105">
                      <span className="text-white font-semibold">{col.split(" ")[0]}</span>
                      <span className="text-slate-400 text-[10px]">{col.split(" ").slice(1).join(" ")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3.5 mt-3 border-t border-white/10 bg-[#141417] text-slate-100">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Index & Constraints</div>
                <div className="text-[11px] text-emerald-300 font-mono truncate" title={tbl.keysAndIndexes}>
                  {tbl.keysAndIndexes}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#141417] border border-white/10 rounded-xl p-5">
        {/* PostgreSQL DDL statement output box */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between bg-[#0E0E10] p-2.5 rounded-t-lg border-t border-x border-white/10">
            <div className="flex items-center gap-2 text-white">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-mono font-medium lowercase tracking-wider text-slate-300">ddl_schema.sql</span>
            </div>
            <button
              id="copy-sql-ddl-btn"
              onClick={copySqlDdl}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] bg-white/5 border border-white/10 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy SQL
                </>
              )}
            </button>
          </div>
          <pre className="text-[10px] font-mono text-slate-300 bg-[#0E0E10] p-4 border border-white/10 rounded-b-lg overflow-x-auto overflow-y-auto max-h-[300px] leading-relaxed custom-scrollbar text-slate-300">
            {auroraPg.ddlSql}
          </pre>
        </div>

        {/* AWS Aurora specific instructions side section */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-black/20 border border-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-100">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h5 className="text-xs font-semibold text-slate-250">Scale Metrics (Aurora Serverless)</h5>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically scales with <strong>ACU increments</strong> (equivalent to ~2GB RAM and CPU equivalents per ACU). Highly scalable for PostgreSQL workloads on high enterprise tiers.
            </p>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between bg-[#0E0E10] p-2 rounded border border-white/5">
              <span>Min Instance Unit:</span>
              <span className="text-[#10b981] font-semibold">0.5 ACU (~$0.06/hour)</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between bg-[#0E0E10] p-2 rounded border border-white/5">
              <span>Max Standard Limit:</span>
              <span className="text-slate-200">16 ACUs</span>
            </div>
          </div>

          <div className="bg-emerald-950/10 border border-emerald-900/60 rounded-lg p-4">
            <div className="flex items-start gap-2.5">
              <Settings className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Relational Index Alignment</h5>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {auroraPg.indexingSuggestions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
