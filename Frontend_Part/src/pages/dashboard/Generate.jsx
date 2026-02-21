import { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import ToolSelector from "../../components/ai/ToolSelector";
import SQLInput from "../../components/ai/SQLInput";
import SQLOutput from "../../components/ai/SQLOutput";
import { apiRequest } from "../../services/api";
import { 
  Terminal, Zap, Command, ArrowRight, 
  Loader2, Code2, Database, Copy, Check,
  Lock, ArrowUpRight, Cpu, Activity, ChevronRight, AlertCircle
} from "lucide-react";

export default function Generate() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState("generate");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Pro logic: only "generate" is free
  const isLocked = user?.plan !== "pro" && mode !== "generate";

  const getPlaceholder = () => {
    switch(mode) {
      case 'optimize': return "-- Paste SQL to analyze and improve performance...";
      case 'explain': return "-- Paste SQL to translate into plain-English logic...";
      case 'validate': return "-- Paste SQL to check for syntax and schema errors...";
      default: return "Describe the data you need (e.g., 'Revenue by category for 2024')...";
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || loading || isLocked) return;
    try {
      setLoading(true);
      setError(null);
      const isGenerate = mode === "generate";
      const payload = { mode, [isGenerate ? "prompt" : "sql"]: input };
      const res = await apiRequest("/ai", "POST", payload);
      setResult(res.result);
    } catch (err) {
      setError(err.message || "Neural engine synchronization failed.");
    } finally {
      setLoading(false);
    }
  }, [input, mode, loading, isLocked]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit]);

  return (
    <div className="min-h-full bg-[#FDFDFD] text-slate-900 selection:bg-emerald-100 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      <main className="dashboard-page relative z-10">
        
        {/* --- PROFESSIONAL HEADER --- */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-100 pb-12 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Core Intelligence Hub</span>
            </div>
            <h1 className="dashboard-heading text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-none">
              SQL <span className="text-emerald-500">Workspace</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">Neural query orchestration for high-performance teams.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
             <StatMini icon={<Activity size={16}/>} label="Neural Status" value="Online" color="text-emerald-500" />
             <StatMini icon={<Cpu size={16}/>} label="Compute Latency" value="18ms" color="text-blue-500" />
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 lg:gap-16">
          
          {/* --- LEFT: EDITOR AREA --- */}
          <div className="xl:col-span-7 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <ToolSelector mode={mode} setMode={setMode} />
              <div className="hidden sm:flex items-center gap-3 pr-4 text-slate-300">
                <Command size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">CMD + ENTER</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/40">
              {isLocked ? (
                /* --- PROFESSIONAL LOCKED UI --- */
                <div className="relative min-h-[550px] lg:min-h-[650px] flex items-center justify-center p-8 overflow-hidden">
                  <div className="absolute inset-0 bg-slate-950" />
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                  
                  <div className="relative z-10 max-w-sm text-center space-y-8">
                    <div className="inline-flex p-6 rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl">
                      <Lock className="text-emerald-400" size={36} />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-3xl font-black text-white tracking-tight">
                        Advanced <span className="text-emerald-500">Intelligence.</span>
                      </h2>
                      <p className="text-slate-400 font-medium leading-relaxed">
                        The <span className="text-white capitalize">{mode}</span> engine is reserved for Pro users. Gain access to sub-second schema analysis and priority neural compute.
                      </p>
                    </div>
                    <div className="pt-4 flex flex-col gap-4">
                      <button 
                        onClick={() => navigate("/dashboard/pricing")}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-16 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                      >
                        Unlock Pro Access <ArrowUpRight size={18} />
                      </button>
                      <button 
                        onClick={() => setMode("generate")}
                        className="text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-[0.3em] transition-colors"
                      >
                        Back to SQL Generator
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* --- ACTIVE EDITOR UI --- */
                <div className="flex flex-col">
                  <SQLInput
                    value={input}
                    onChange={setInput}
                    mode={mode}
                    loading={loading}
                    placeholder={getPlaceholder()}
                    className="w-full min-h-[400px] lg:min-h-[500px] p-10 text-xl font-medium focus:outline-none"
                  />
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-6">
                    {error && (
                      <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
                        <AlertCircle size={16} /> {error}
                      </div>
                    )}
                    <button 
                      onClick={handleSubmit}
                      disabled={loading || !input.trim()}
                      className="group w-full h-16 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 text-white rounded-[22px] transition-all flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98]"
                    >
                      {loading ? (
                        <Loader2 size={20} className="animate-spin text-emerald-400" />
                      ) : (
                        <>
                          <Zap size={18} className="text-emerald-400 fill-emerald-400" />
                          Execute Neural Command
                          <ChevronRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT: OUTPUT TERMINAL --- */}
          <div className="xl:col-span-5 h-full animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="xl:sticky xl:top-10">
              <div className="bg-[#020617] border border-slate-800 rounded-[40px] shadow-2xl flex flex-col h-[440px] sm:h-[520px] lg:h-[800px] overflow-hidden">
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-800" />
                      <div className="w-3 h-3 rounded-full bg-slate-800" />
                    </div>
                    <div className="h-4 w-px bg-slate-800" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-mono italic">query_output.sql</span>
                  </div>
                  {result && (
                    <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                      {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                  {result ? (
                    <SQLOutput result={result} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-6">
                      <div className="w-20 h-20 rounded-[32px] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                        <Terminal size={32} className="text-slate-600" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Awaiting Pipeline Instruction</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatMini({ icon, label, value, color }) {
  return (
    <div className="bg-white border border-slate-200 px-6 py-4 rounded-3xl flex items-center gap-5 shadow-sm flex-1 lg:flex-none lg:min-w-[200px] group hover:border-slate-300 transition-colors">
      <div className={`${color} bg-slate-50 p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-base font-bold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
