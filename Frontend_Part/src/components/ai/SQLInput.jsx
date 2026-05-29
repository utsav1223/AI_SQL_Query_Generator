import { Command, Terminal } from "lucide-react";
import SQLHighlightedTextarea from "./SQLHighlightedTextarea";

export default function SQLInput({ value, onChange, mode, loading, placeholder }) {
  const editorTitle =
    mode === "generate"
      ? "Natural Language Prompt"
      : mode === "schema"
        ? "Schema Brief"
        : "SQL Source";
  const isPromptMode = ["generate", "schema"].includes(mode);
  const isSQLMode = !isPromptMode;
  const resolvedPlaceholder =
    placeholder ||
    (mode === "generate"
      ? "Example: Find users who purchased more than 500 in the last 30 days."
      : mode === "schema"
      ? "Example: Build a SaaS billing schema with users, organizations, subscriptions, invoices, and audit logs."
      : "SELECT * FROM analytics.events WHERE event_type = 'conversion';");
  const tip =
    mode === "generate"
      ? "Tip: include filters, date ranges, and table names when possible."
      : mode === "schema"
      ? "Tip: describe entities, relationships, ownership, and constraints."
      : mode === "format"
      ? "Tip: paste rough SQL to normalize indentation and clause spacing."
      : "Tip: use clean ANSI-style SQL for easier optimization and validation.";

  return (
    <div className="w-full">
      <div className="surface-card-soft rounded-t-lg border-b-0 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-slate-500 dark:text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {editorTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSQLMode ? (
              <span className="hidden rounded-md bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--accent)] sm:inline-flex">
                Highlighting
              </span>
            ) : null}
            <div className="hidden items-center gap-1 rounded-md bg-[var(--surface)] px-2 py-1 sm:flex">
              <Command size={10} className="text-slate-400" />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Enter
              </span>
            </div>
            <div className={`h-2 w-2 rounded-full ${loading ? "bg-amber-400" : "bg-[var(--accent)]"}`} />
          </div>
        </div>
      </div>

      {isSQLMode ? (
        <SQLHighlightedTextarea
          value={value}
          onChange={onChange}
          loading={loading}
          placeholder={resolvedPlaceholder}
        />
      ) : (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={resolvedPlaceholder}
          className={`input-control custom-scrollbar mono-font min-h-[240px] w-full resize-none rounded-b-lg border-t-0 px-4 py-4 text-[13px] leading-7 sm:min-h-[300px] ${
            loading ? "cursor-wait opacity-60" : ""
          }`}
        />
      )}

      <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {tip}
      </p>
    </div>
  );
}
