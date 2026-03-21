import { Search, ShieldCheck, Sparkles, Zap } from "lucide-react";

const tools = [
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "optimize", label: "Optimize", icon: Zap },
  { id: "explain", label: "Explain", icon: Search },
  { id: "validate", label: "Validate", icon: ShieldCheck }
];

export default function ToolSelector({ mode, setMode }) {
  return (
    <div className="surface-card-soft rounded-2xl p-1.5">
      <div className="grid grid-cols-2 gap-1.5 lg:flex">
        {tools.map((tool) => {
          const isActive = mode === tool.id;
          const Icon = tool.icon;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setMode(tool.id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] transition-colors ${
                isActive
                  ? "bg-[var(--surface)] text-[var(--accent)]"
                  : "text-slate-500 hover:bg-[var(--surface)] hover:text-[var(--text-main)] dark:text-slate-400"
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
