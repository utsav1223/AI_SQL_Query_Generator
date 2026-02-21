import { BookOpen, CheckCircle2, Terminal } from "lucide-react";

export default function SQLOutput({ result, mode = "generate" }) {
  if (!result) return null;

  const isExplainMode = mode === "explain";
  const isValidateMode = mode === "validate";

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
            {isExplainMode ? <BookOpen size={14} /> : <Terminal size={14} />}
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {isExplainMode ? "Neural Explanation" : "Engine Output"}
          </h3>
        </div>

        {isValidateMode && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Valid Syntax</span>
          </div>
        )}
      </div>

      <div className="relative group overflow-hidden rounded-[24px] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-1.5 px-5 py-3 bg-[#0F172A] border-b border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <span className="ml-2 text-[10px] font-mono text-slate-500 font-bold tracking-widest uppercase italic opacity-60">
            {isExplainMode ? "analysis_report.txt" : "query_result.sql"}
          </span>
        </div>

        <div
          className={`
            p-5 md:p-8 overflow-auto max-h-[520px] md:max-h-[600px] custom-scrollbar
            ${isExplainMode ? "bg-[#020617] text-slate-300 font-sans" : "bg-[#020617] text-emerald-400 font-mono"}
          `}
        >
          <pre
            className={`
              whitespace-pre-wrap break-words
              ${isExplainMode ? "text-sm md:text-base leading-relaxed font-medium" : "text-[13px] md:text-[15px] leading-relaxed tracking-tight"}
            `}
          >
            {!isExplainMode && <span className="select-none mr-4 text-slate-700 font-bold italic">$</span>}
            {result}
          </pre>
        </div>

        <div className="px-5 py-2 bg-slate-900/50 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Ready</span>
          </div>
          <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest font-bold">UTF-8 | SQL_ANSI</span>
        </div>
      </div>

      {isExplainMode && (
        <p className="mt-3 px-2 text-[10px] text-slate-400 font-medium italic">
          Note: explanation is generated from model reasoning and your saved schema context.
        </p>
      )}
    </div>
  );
}
