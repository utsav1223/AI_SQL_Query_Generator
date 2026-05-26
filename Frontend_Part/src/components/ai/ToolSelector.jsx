import { Search, ShieldCheck, Sparkles, Zap } from "lucide-react";

const tools = [
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "optimize", label: "Optimize", icon: Zap },
  { id: "explain", label: "Explain", icon: Search },
  { id: "validate", label: "Validate", icon: ShieldCheck }
];

export default function ToolSelector({ mode, setMode }) {
  return (
    <div className="surface-card-soft rounded-lg p-1.5">
      <div className="grid grid-cols-2 gap-1.5 lg:flex">
        {tools.map((tool) => {
          const isActive = mode === tool.id;
          const Icon = tool.icon;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setMode(tool.id)}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                isActive
                  ? "border-teal-200 bg-white text-teal-800 shadow-sm dark:border-teal-400/20 dark:bg-slate-950 dark:text-teal-200"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-950 dark:hover:text-slate-100"
              }`}
            >
              <Icon size={14} />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
