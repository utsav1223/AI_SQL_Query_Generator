import { BookOpen, CheckCircle2, Terminal } from "lucide-react";

export default function SQLOutput({ result, mode = "generate" }) {
  if (!result) {
    return null;
  }

  const isExplainMode = mode === "explain";
  const isValidateMode = mode === "validate";

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            {isExplainMode ? <BookOpen size={14} /> : <Terminal size={14} />}
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {isExplainMode ? "Explanation" : "Output"}
          </p>
        </div>

        {isValidateMode ? (
          <span className="badge-accent rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
            <CheckCircle2 size={12} />
            Valid Syntax
          </span>
        ) : null}
      </div>

      <div className="code-shell overflow-hidden rounded-lg">
        <div className="code-toolbar flex items-center gap-2 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500/40" />
          <span className="mono-font ml-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {isExplainMode ? "analysis.txt" : "result.sql"}
          </span>
        </div>

        <div className="custom-scrollbar max-h-[560px] overflow-auto px-5 py-5 sm:px-6 sm:py-6">
          <pre
            className={`whitespace-pre-wrap break-words ${
              isExplainMode
                ? "text-sm leading-7 text-slate-200"
                : "mono-font text-[13px] leading-7 text-emerald-300"
            }`}
          >
            {result}
          </pre>
        </div>
      </div>

      {isExplainMode ? (
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Explanation is based on the model output and your saved schema context.
        </p>
      ) : null}
    </div>
  );
}
