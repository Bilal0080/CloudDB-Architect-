import React, { useState } from "react";
import { VercelIntegration } from "../types";
import { Key, Code, Copy, Check, Terminal, ExternalLink, CloudLightning } from "lucide-react";

interface IntegrationSnippetsProps {
  snippet: VercelIntegration;
}

export default function IntegrationSnippets({ snippet }: IntegrationSnippetsProps) {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyEnv = () => {
    navigator.clipboard.writeText(snippet.envConfig);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippet.nodeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#141417] border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <CloudLightning className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-semibold text-white">Vercel Backend Secret Configurations (.env)</h4>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Add these configurations into the <strong>Vercel Project Dashboard &gt; Settings &gt; Environment Variables</strong> panel before deploying.
        </p>

        <div className="bg-[#0E0E10] rounded-lg border border-white/10">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-medium">.env.production</span>
            <button
              id="copy-env-btn"
              onClick={copyEnv}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedEnv ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy .env
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-mono text-slate-350 bg-[#0E0E10] p-4 overflow-x-auto text-slate-300 select-all leading-relaxed whitespace-pre-wrap">
            {snippet.envConfig}
          </pre>
        </div>
      </div>

      <div className="bg-[#141417] border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Code className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-semibold text-white">Lazy-Loaded AWS Client (Vercel Serverless Function)</h4>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Copy this Node.js API endpoint boilerplate into your Vercel project at <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-[11px] border border-white/5">/api/store.js</code>. It utilizes lazy client instantiation to prevent serverless execution timeouts.
        </p>

        <div className="bg-[#0E0E10] rounded-lg border border-white/10">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-medium">api/store.js</span>
            <button
              id="copy-func-btn"
              onClick={copyCode}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy Code
                </>
              )}
            </button>
          </div>
          <pre className="text-[10px] font-mono text-slate-300 bg-[#0E0E10] p-4 overflow-x-auto overflow-y-auto max-h-[350px] leading-relaxed custom-scrollbar text-slate-300">
            {snippet.nodeCode}
          </pre>
        </div>
      </div>

      <div className="border border-white/10 rounded-xl p-4 bg-[#141417] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-widest font-mono">Submission Documentation Note</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Need proving imagery for AWS? Make a quick screenshot of your Vercel Storage Environment Variables, or your AWS IAM / RDS console and insert it into your final project readmes.
          </p>
        </div>
        <a
          href="https://vercel.com/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-350 rounded-lg transition-colors cursor-pointer shrink-0 font-medium"
        >
          View Vercel Docs <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
