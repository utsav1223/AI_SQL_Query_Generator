import { Command, Terminal } from "lucide-react";

export default function SQLInput({ value, onChange, mode, loading, placeholder }) {
  return (
    <div className="relative flex flex-col w-full group">
      <div className="flex items-center justify-between px-5 sm:px-6 py-3 bg-slate-50 border-x border-t border-slate-200 rounded-t-[24px] transition-colors group-focus-within:bg-white group-focus-within:border-emerald-200">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-slate-400 group-focus-within:text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-slate-600">
            {mode === "generate" ? "Natural Language Prompt" : "SQL Source Editor"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
            <Command size={10} className="text-slate-400" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Enter</span>
          </div>
          <div className={`h-2 w-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            placeholder ||
            (mode === "generate"
              ? "Example: Find users who purchased more than 500 in the last 30 days..."
              : "SELECT * FROM analytics.events WHERE event_type = 'conversion';")
          }
          className={`
            w-full min-h-[260px] sm:min-h-[320px] lg:min-h-[400px] p-5 md:p-8
            bg-white border border-slate-200 rounded-b-[24px]
            text-base md:text-lg font-mono text-slate-800 leading-relaxed
            placeholder:text-slate-300 placeholder:italic
            focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30
            transition-all duration-300 resize-none custom-scrollbar
            ${loading ? "opacity-50 grayscale cursor-wait" : "opacity-100"}
          `}
        />

        <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex items-center gap-3 sm:gap-4">
          {value.length > 0 && !loading && (
            <div className="hidden sm:block animate-in fade-in slide-in-from-right-2 text-[10px] font-mono font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 uppercase tracking-tighter">
              {value.length} chars
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 px-2">
        <p className="text-[10px] text-slate-400 font-medium">
          {mode === "generate"
            ? "Pro tip: mention date ranges and join columns for higher quality SQL."
            : "Pro tip: use ANSI SQL syntax for better cross-database compatibility."}
        </p>
      </div>
    </div>
  );
}
