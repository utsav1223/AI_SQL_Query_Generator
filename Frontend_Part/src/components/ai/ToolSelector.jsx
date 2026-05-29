import { AlignLeft, Database, Lock, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";

const tools = [
  {
    id: "generate",
    label: "Generate Query",
    shortLabel: "Generate",
    description: "English + saved schema to SQL.",
    plan: "Free",
    icon: Sparkles
  },
  {
    id: "schema",
    label: "Generate Schema",
    shortLabel: "Schema",
    description: "English product brief to DDL.",
    plan: "Pro",
    icon: Database
  },
  {
    id: "optimize",
    label: "Optimize",
    shortLabel: "Optimize",
    description: "Rewrite SQL for performance.",
    plan: "Pro",
    icon: Zap
  },
  {
    id: "format",
    label: "Format",
    shortLabel: "Format",
    description: "Clean indentation and clauses.",
    plan: "Pro",
    icon: AlignLeft
  },
  {
    id: "validate",
    label: "Validate",
    shortLabel: "Validate",
    description: "Fix syntax and obvious issues.",
    plan: "Pro",
    icon: ShieldCheck
  },
  {
    id: "explain",
    label: "Explain",
    shortLabel: "Explain",
    description: "Explain query behavior clearly.",
    plan: "Pro",
    icon: Search
  }
];

export default function ToolSelector({ mode, setMode, paidPlan = false }) {
  const selectedTool = tools.find((tool) => tool.id === mode) || tools[0];
  const SelectedIcon = selectedTool.icon;
  const selectedLocked = selectedTool.plan === "Pro" && !paidPlan;

  return (
    <div className="surface-card-soft rounded-lg p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
            Tool
          </p>
          <h2 className="mt-1 text-sm font-bold text-slate-950 dark:text-slate-100">
            Choose workflow
          </h2>
        </div>
        <span className="rounded-md border border-[var(--accent-soft-strong)] bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
          {paidPlan ? "Pro" : "Free"}
        </span>
      </div>

      <select
        value={mode}
        onChange={(event) => setMode(event.target.value)}
        className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      >
        {tools.map((tool) => (
          <option key={tool.id} value={tool.id}>
            {tool.label} {tool.plan === "Pro" ? "(Pro)" : "(Free)"}
          </option>
        ))}
      </select>

      <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
            <SelectedIcon size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-950 dark:text-slate-100">
                {selectedTool.label}
              </p>
              {selectedLocked ? <Lock size={12} className="text-amber-500" /> : null}
              <span className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                selectedTool.plan === "Free"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}>
                {selectedTool.plan}
              </span>
            </div>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500 dark:text-slate-400">
              {selectedTool.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
