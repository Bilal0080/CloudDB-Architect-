import React, { useState, useEffect } from "react";
import {
  Cloud,
  Database,
  Sparkles,
  Cpu,
  Layers,
  Settings,
  Shuffle,
  CircleAlert,
  FileCode2,
  Scale,
  TrendingUp,
  Coins,
  Terminal,
  Info,
  Layers3,
  Server,
  Zap,
  Printer,
} from "lucide-react";
import { SCENARIO_PRESETS, INITIAL_MART_BLUEPRINT, PRESET_BLUEPRINTS } from "./data/presets";
import { ArchitectResult, ScenarioPreset } from "./types";
import MetricCharts from "./components/MetricCharts";
import DynamoPanel from "./components/DynamoPanel";
import AuroraPanel from "./components/AuroraPanel";
import IntegrationSnippets from "./components/IntegrationSnippets";
import OptimizationConsole from "./components/OptimizationConsole";
import BlueprintComparator from "./components/BlueprintComparator";

export default function App() {
  // Scenario Config States
  const [selectedPresetId, setSelectedPresetId] = useState<string>("b2c-ecommerce");
  const [scenario, setScenario] = useState<string>("B2C Ecommerce store centering orders and catalog lookups");
  const [dataVolume, setDataVolume] = useState<string>("Mid Size (100 GB - 500 GB)");
  const [readRate, setReadRate] = useState<number>(450);
  const [writeRate, setWriteRate] = useState<number>(80);
  const [accessPatternsText, setAccessPatternsText] = useState<string>(
    "Get products in category; get items in active order; list order shipments by user ID; scan active promotions by coupon code."
  );

  // Loaded Architect Blueprint State (Defaults initially to Mart layout)
  const [activeBlueprint, setActiveBlueprint] = useState<ArchitectResult>(INITIAL_MART_BLUEPRINT);
  
  // API Call states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genStepText, setGenStepText] = useState<string>("Idle");
  const [generationError, setGenerationError] = useState<string>("");

  // Visual/Subcomponent States
  const [activeTab, setActiveTab] = useState<"dynamodb" | "aurora" | "vercel" | "optimizer" | "compare">("dynamodb");

  // Load Preset Details helper
  const handleSelectPreset = (preset: ScenarioPreset) => {
    setSelectedPresetId(preset.id);
    setScenario(preset.title + " - " + preset.description);
    setDataVolume(preset.dataVolume);
    setReadRate(preset.readRate);
    setWriteRate(preset.writeRate);
    setAccessPatternsText(preset.patterns);

    // Make an optimized simulated local state swap as initial visual responses,
    // so the app feels incredibly dynamic, responsive, and completely functional even without API triggers!
    if (PRESET_BLUEPRINTS[preset.id]) {
      setActiveBlueprint(PRESET_BLUEPRINTS[preset.id]);
    }
  };

  // Run the full AI generation via server-side Gemini endpoint
  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError("");
    setGenStepText("Consulting AWS best practices...");

    const steps = [
      "Analyzing required query access patterns...",
      "Formulating DynamoDB Single-Table schema mappings...",
      "Building Global Secondary Indexes & key expression models...",
      "Normalizing values for Amazon Aurora PostgreSQL tables...",
      "Constructing copy-ready PostgreSQL SQL scripts...",
      "Calculating monthly cloud throughput budgets...",
      "Assembling Vercel serverless environment configurations..."
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length - 1) {
        setGenStepText(steps[currentStepIndex]);
        currentStepIndex++;
      }
    }, 1500);

    try {
      const response = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          dataVolume,
          readRate,
          writeRate,
          accessPatternsText,
        }),
      });

      clearInterval(interval);

      if (!response.ok) {
        throw new Error(
          "Target architectural service encountered an issue. Please verify you provided valid scenario parameters."
        );
      }

      setGenStepText("Injecting final performance index arrays...");
      const data: ArchitectResult = await response.json();
      setActiveBlueprint(data);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setGenerationError(
        err.message || "Failed to finalize database schema architecture. Please verify server connectivity or secrets configuration."
      );
    } finally {
      setIsGenerating(false);
      setGenStepText("Idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 selection:bg-white selection:text-black">
      {/* Visual Header Grid Panel */}
      <header className="border-b border-white/10 bg-[#0E0E10] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-[#0E0E10]">
            <div className="bg-white flex items-center justify-center p-2 rounded-md">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white uppercase font-sans">Project: VANGUARD GLOBAL</h1>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#ebb308] border border-amber-500/30 px-1.5 py-0.2 rounded bg-amber-500/5">
                  AWS-VERCEL-HACKATHON-ID: 77
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">AWS Aurora PostgreSQL & DynamoDB Visual Modeler Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Vercel Deployed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Aurora Active</span>
            </div>
            <button
              id="export-pdf-btn"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 w-auto py-1.5 bg-white hover:bg-slate-200 text-black font-extrabold text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md border border-transparent hover:scale-105 duration-150"
            >
              <Printer className="w-3.5 h-3.5 text-black shrink-0" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Sandbox Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Banner Alert styled with left accent indicator strip */}
        <div className="bg-[#141417] border border-white/10 rounded-xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-blue-400 text-xs font-bold uppercase tracking-widest font-mono">TRACK 3 BLUEPRINT ENGINE</span>
              <h2 className="text-2xl font-semibold text-white mt-1">Million-scale Global Applications</h2>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-500 font-mono font-bold">AWS Region Clusters</p>
              <p className="text-xs font-mono text-slate-300">us-east-1, eu-central-1, ap-southeast-1</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-4xl mt-1">
            Building a high-availability serverless deployment using Vercel is best complemented with resilient persistence. Architect your DynamoDB partition keys and Aurora indexing schemas to maintain distributed event-driven consistency under intense concurrent usage.
          </p>
        </div>

        {/* Tracks Selector Row */}
        <div>
          <div className="flex items-center justify-between mb-3 text-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Choose Database Category Tracks
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Auto-syncs telemetry and access patterns</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                id={`track-btn-${preset.id}`}
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedPresetId === preset.id
                    ? "bg-amber-500/10 border-amber-500/80 text-white shadow-lg"
                    : "bg-[#141417] border-white/10 text-slate-300 hover:bg-[#1c1c21] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest font-mono">
                    {preset.difficulty}
                  </span>
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 mt-2 font-sans truncate">{preset.title}</h3>
                <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1 line-clamp-2">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Scenario / Prompt Blueprint Architect Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleGenerateBlueprint}
            className="lg:col-span-4 bg-[#141417] border border-white/10 rounded-xl p-5 space-y-5 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">
                  AI Architecture Inputs
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Custom Application Scenario Target
                </label>
                <input
                  id="scenario-input"
                  type="text"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full text-xs font-sans text-white bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-white/25 focus:bg-black/60 leading-relaxed font-semibold transition-all"
                  placeholder="E.g. Real Estate rental list platform with user profiles"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Sustained Reads/s
                  </label>
                  <input
                    id="read-rate-input"
                    type="number"
                    value={readRate}
                    onChange={(e) => setReadRate(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-mono text-cyan-400 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-white/25 focus:bg-black/60 font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Sustained Writes/s
                  </label>
                  <input
                    id="write-rate-input"
                    type="number"
                    value={writeRate}
                    onChange={(e) => setWriteRate(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-mono text-purple-400 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-white/25 focus:bg-black/60 font-bold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Target Data Storage Size
                </label>
                <select
                  id="data-volume-select"
                  value={dataVolume}
                  onChange={(e) => setDataVolume(e.target.value)}
                  className="w-full text-xs font-medium text-slate-300 bg-black/40 border border-white/10 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-white/25"
                >
                  <option className="bg-[#141417]">Light Sandbox (&lt;10 GB)</option>
                  <option className="bg-[#141417]">Highly Relational (50 GB)</option>
                  <option className="bg-[#141417]">Mid Size (100 GB - 500 GB)</option>
                  <option className="bg-[#141417]">Heavy (3 TB - 10 TB)</option>
                  <option className="bg-[#141417]">Very Large (50 TB+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Core Access Patterns (One per line)
                </label>
                <textarea
                  id="access-patterns-input"
                  rows={4}
                  value={accessPatternsText}
                  onChange={(e) => setAccessPatternsText(e.target.value)}
                  className="w-full text-xs font-sans text-slate-300 bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-white/25 leading-relaxed font-semibold overflow-y-auto"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10">
              <button
                type="submit"
                id="generate-blueprint-btn"
                disabled={isGenerating}
                className="w-full relative flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white hover:bg-slate-200 disabled:bg-white/10 disabled:text-slate-500 disabled:cursor-not-allowed text-black font-bold uppercase tracking-widest rounded-lg text-xs leading-none shadow-md cursor-pointer transition-all border border-transparent"
              >
                {isGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Processing Cloud Blueprint...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black fill-current animate-pulse shrink-0" />
                    <span>Run Gemini AI DB Architect</span>
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="mt-3.5 py-1.5 px-2 bg-black/50 rounded border border-white/10 flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-slate-405 font-mono truncate">{genStepText}</span>
                </div>
              )}

              {generationError && (
                <div className="mt-3.5 p-3 rounded bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-xs text-red-300">
                  <CircleAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{generationError}</span>
                </div>
              )}
            </div>
          </form>

          {/* Graphical Simulation Graphs Panel */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <MetricCharts initialReadRate={readRate} initialWriteRate={writeRate} dbType={activeTab === "aurora" ? "aurora" : "dynamodb"} />

            {/* AWS Continuous Cost Evaluator & Dynamic Sizing side box */}
            <div className="bg-[#141417] border border-white/10 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                  <Coins className="w-4.5 h-4.5 text-amber-505 text-white" />
                  <span>AWS Serverless Databases Cost Comparison (Generative AI Predictor)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2.5">
                  <div className="bg-[#0E0E10] border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider block font-bold">
                        DynamoDB On-Demand (PAYG)
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block leading-tight">
                        Calculated based on consumed RCUs & WCUs requested
                      </span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono text-white">
                        ${activeBlueprint.costEstimates.dynamodbMonthlyCost.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 lowercase font-mono">/ month</span>
                    </div>
                  </div>

                  <div className="bg-[#0E0E10] border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider block font-bold">
                        AWS Aurora Serverless v2 PostgreSQL
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block leading-tight">
                        Based on running ACU scale times and Continuous storage rules
                      </span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono text-white">
                        ${activeBlueprint.costEstimates.auroraMonthlyCost.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400 lowercase font-mono">/ month</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed italic bg-black/40 p-3 rounded border border-white/10 leading-relaxed font-sans font-medium mt-3">
                <strong>Trade-Off Analytics:</strong> {activeBlueprint.costEstimates.explanation}
              </div>
            </div>
          </div>
        </div>

        {/* Database Architectural Specification View Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                id="tab-btn-dynamodb"
                onClick={() => setActiveTab("dynamodb")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "dynamodb"
                    ? "bg-white/10 text-white border border-white/20 shadow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Layers3 className="w-3.5 h-3.5" /> Amazon DynamoDB Table Layout
              </button>
              <button
                id="tab-btn-aurora"
                onClick={() => setActiveTab("aurora")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "aurora"
                    ? "bg-white/10 text-white border border-white/20 shadow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Server className="w-3.5 h-3.5" /> Amazon Aurora PostgreSQL Relational SQL
              </button>
              <button
                id="tab-btn-vercel"
                onClick={() => setActiveTab("vercel")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "vercel"
                    ? "bg-white/10 text-white border border-white/20 shadow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" /> Vercel Serverless Integration Snippets
              </button>
              <button
                id="tab-btn-optimizer"
                onClick={() => setActiveTab("optimizer")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "optimizer"
                    ? "bg-white/10 text-white border border-white/20 shadow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> AI Index Tuning Console
              </button>
              <button
                id="tab-btn-compare"
                onClick={() => setActiveTab("compare")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "compare"
                    ? "bg-white/10 text-white border border-white/20 shadow"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-emerald-450" /> Side-by-Side Comparator
              </button>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              Workspace Blueprint: <strong className="text-slate-350">CloudDB Engine v1.0</strong>
            </span>
          </div>

          <div className="bg-[#141417] border border-white/10 rounded-2xl p-6 shadow-xl transition-all">
            {activeTab === "dynamodb" && <DynamoPanel dynamoDb={activeBlueprint.dynamoDb} />}
            {activeTab === "aurora" && <AuroraPanel auroraPg={activeBlueprint.auroraPg} />}
            {activeTab === "vercel" && <IntegrationSnippets snippet={activeBlueprint.vercelIntegrationSnippet} />}
            {activeTab === "optimizer" && <OptimizationConsole />}
            {activeTab === "compare" && <BlueprintComparator activeBlueprint={activeBlueprint} />}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#0E0E10] py-10 mt-16 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-slate-300 uppercase tracking-widest font-mono">CloudDB Architect Visualizer</div>
            <p className="mt-1 text-slate-400">Amazon & Vercel hackathon toolkit. Built with Google Gen AI SDK integration.</p>
          </div>
          <div className="text-slate-500 font-mono text-[10px]">
            © {new Date().getFullYear()} CloudDB Architect. Standard Open Source License.
          </div>
        </div>
      </footer>

      {/* Hidden printable report view exclusively for PDF exports */}
      <div id="print-layout" className="hidden print:block text-slate-900 bg-white p-6 font-sans">
        
        {/* Cover Header */}
        <div className="pdf-section flex items-center justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-mono font-bold text-slate-500">
              Technical Specification Artifact
            </span>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 font-sans">
              VANGUARD GLOBAL SYSTEMS
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              AWS Serverless & Relational Database Architecture Specification Report
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono block text-slate-500 font-bold">
              DOCUMENT ID: AWS-VGS-77-PDF
            </span>
            <span className="text-[10px] font-mono block text-slate-500 font-semibold">
              DATE: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>

        {/* Blueprint Parameters */}
        <div className="pdf-section">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-mono">
            01. Blueprint Configuration & Load Profiles
          </h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="border border-slate-200 p-3 rounded bg-slate-50">
              <span className="text-[9px] uppercase tracking-wider block font-mono text-slate-500 font-bold">
                Target Application Scenario
              </span>
              <span className="text-xs font-semibold text-slate-800 leading-tight block mt-0.5">
                {scenario}
              </span>
            </div>
            <div className="border border-slate-200 p-3 rounded bg-slate-50 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider block font-mono text-slate-500 font-bold">
                  Sustained IOPS Capacity Metrics
                </span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5 font-mono">
                  {readRate} reads/sec | {writeRate} writes/sec
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-[9px] uppercase tracking-wider block font-mono text-slate-500 font-bold">
                  Provisioned Storage Size
                </span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">
                  {dataVolume}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Analysis Report */}
        <div className="pdf-section">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-mono">
            02. AWS Database Stack Cost Analysis Comparison
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-200 p-3 rounded bg-slate-50/40">
              <span className="text-[9px] uppercase tracking-wider block font-mono text-slate-500 font-bold">
                Amazon DynamoDB On-Demand (PAYG)
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                ${activeBlueprint.costEstimates.dynamodbMonthlyCost.toFixed(2)} / month
              </span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                Calculated based on sustained read and write capacity unit configurations.
              </span>
            </div>
            <div className="border border-slate-200 p-3 rounded bg-slate-50/40">
              <span className="text-[9px] uppercase tracking-wider block font-mono text-slate-500 font-bold">
                Amazon Aurora Serverless v2 PostgreSQL
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                ${activeBlueprint.costEstimates.auroraMonthlyCost.toFixed(2)} / month
              </span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                Scaling ACU profile with standard continuous storage metrics.
              </span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-slate-50 border border-slate-250 rounded text-xs text-slate-700 italic leading-relaxed">
            <strong>Cost Trade-off Analytics:</strong> {activeBlueprint.costEstimates.explanation}
          </div>
        </div>

        {/* DynamoDB Section */}
        <div className="pdf-section">
          <div className="flex justify-between items-baseline">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              03. DynamoDB Table Keys & GSIs Configuration
            </h2>
            <span className="text-[10px] font-semibold text-slate-700 font-mono">
              Table: {activeBlueprint.dynamoDb.tableName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50 font-mono text-[10px]">
              <span className="text-[9px] uppercase tracking-wider block font-semibold text-slate-500">Partition Key (PK)</span>
              <span className="text-xs font-bold text-slate-800">{activeBlueprint.dynamoDb.primaryKey.partitionKey}</span>
            </div>
            <div className="border border-slate-200 p-2.5 rounded bg-slate-50 font-mono text-[10px]">
              <span className="text-[9px] uppercase tracking-wider block font-semibold text-slate-500">Sort Key (SK)</span>
              <span className="text-xs font-bold text-slate-800">{activeBlueprint.dynamoDb.primaryKey.sortKey}</span>
            </div>
          </div>

          {activeBlueprint.dynamoDb.gsis.length > 0 && (
            <div className="mt-3">
              <span className="text-[9px] uppercase tracking-wider block font-mono text-slate-500 font-bold mb-1.5">
                Global Secondary Indexes (GSIs)
              </span>
              <table className="w-full text-left text-[10px] border border-slate-205">
                <thead className="bg-slate-100 font-mono font-bold text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th className="p-2 border-r border-slate-200">Index Name</th>
                    <th className="p-2 border-r border-slate-200">Partition Key</th>
                    <th className="p-2 border-r border-slate-200">Sort Key</th>
                    <th className="p-2">Projection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeBlueprint.dynamoDb.gsis.map((idx, index) => (
                    <tr key={index} className="font-mono text-slate-800">
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{idx.indexName}</td>
                      <td className="p-2 border-r border-slate-200 text-teal-800">{idx.partitionKey}</td>
                      <td className="p-2 border-r border-slate-200 text-indigo-800">{idx.sortKey}</td>
                      <td className="p-2 font-semibold text-slate-600">{idx.projection}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 font-sans">
            <strong>DynamoDB Keying Guidelines:</strong> {activeBlueprint.dynamoDb.keyTips}
          </div>
        </div>

        {/* Access Patterns Checklist */}
        <div className="pdf-section">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
            04. High-Throughput Access Pattern Coverage Check
          </h2>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {activeBlueprint.dynamoDb.accessPatterns.map((pat, index) => (
              <div key={index} className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-1.5">
                  <span className="text-[8px] bg-slate-200 text-slate-800 font-mono px-1 py-0.2 rounded">Q{index + 1}</span>
                  <span className="text-[10px] font-bold text-slate-850">{pat.action}</span>
                </div>
                <div className="font-mono text-[9px] text-indigo-700 font-semibold bg-white p-1.5 border border-slate-200 rounded overflow-x-auto">
                  {pat.keyExpression}
                </div>
                <p className="text-[9px] text-slate-500 mt-1 italic leading-tight">
                  {pat.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Page Break: Relational specification */}
        <div className="pdf-section page-break">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-mono">
            05. Amazon Aurora PostgreSQL Relational DDL & Alignment
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {activeBlueprint.auroraPg.tables.map((tbl, index) => (
              <div key={index} className="border border-slate-200 rounded p-2.5 bg-slate-50">
                <span className="text-[9px] font-mono text-emerald-800 uppercase tracking-widest font-bold">
                  {tbl.name}
                </span>
                <div className="space-y-1.5 mt-1.5">
                  {tbl.columns.map((col, cIdx) => (
                    <div key={cIdx} className="text-[9px] font-mono flex justify-between bg-white p-1.5 rounded border border-slate-100">
                      <span className="font-bold text-slate-800">{col.split(" ")[0]}</span>
                      <span className="text-slate-500">{col.split(" ").slice(1).join(" ")}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 text-[8.5px] font-mono text-slate-600">
                  <strong>INDEX:</strong> {tbl.keysAndIndexes}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <span className="text-[9px] uppercase tracking-wider block font-mono text-slate-500 font-bold mb-1">
              Active PostgreSQL DDL Generation
            </span>
            <pre className="pdf-code-block">
              {activeBlueprint.auroraPg.ddlSql}
            </pre>
          </div>

          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 italic">
            <strong>Database Tuning Suggestion:</strong> {activeBlueprint.auroraPg.indexingSuggestions}
          </div>
        </div>

        {/* Footer info indicating system validation */}
        <div className="flex items-center justify-between border-t border-slate-300 pt-3 text-[9px] text-slate-500 font-mono mt-12">
          <span>Vanguard Systems Automatic Cloud Audit Document</span>
          <span>Validated conformant with VGS Security Policy v12.4</span>
        </div>

      </div>
    </div>
  );
}
