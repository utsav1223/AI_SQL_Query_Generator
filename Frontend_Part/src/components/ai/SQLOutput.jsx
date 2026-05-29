import { useEffect, useEffectEvent, useMemo, useState } from "react";
import {
  AlignLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  SearchCheck,
  ShieldCheck,
  Terminal,
  Zap
} from "lucide-react";
import SQLSyntaxHighlighter from "./SQLSyntaxHighlighter";
import { buildSQLFilename, downloadSQLFile } from "../../utils/sqlExport";

const SQL_REVIEW_ACTIONS = [
  { id: "optimize", label: "Optimize", icon: Zap },
  { id: "format", label: "Format", icon: AlignLeft },
  { id: "validate", label: "Validate", icon: ShieldCheck },
  { id: "explain", label: "Explain", icon: SearchCheck }
];

const SCHEMA_REVIEW_ACTIONS = [
  { id: "format", label: "Format", icon: AlignLeft },
  { id: "validate", label: "Validate", icon: ShieldCheck },
  { id: "explain", label: "Explain", icon: SearchCheck }
];

export default function SQLOutput({
  result,
  mode = "generate",
  onApplyResult,
  onSendToTool,
  onSaveSchemaResult,
  savingSchema = false
}) {
  const [typingState, setTypingState] = useState({ source: "", text: "" });
  const [copiedSource, setCopiedSource] = useState("");
  const output = result || "";
  const isExplainMode = mode === "explain";
  const isValidateMode = mode === "validate";
  const isFormatMode = mode === "format";
  const isSchemaMode = mode === "schema";
  const canExport = !isExplainMode && Boolean(output.trim());
  const canApply = isFormatMode && typeof onApplyResult === "function" && Boolean(output.trim());
  const canSendToTool = !isExplainMode && typeof onSendToTool === "function" && Boolean(output.trim());
  const reviewActions = (isSchemaMode ? SCHEMA_REVIEW_ACTIONS : SQL_REVIEW_ACTIONS).filter(
    (action) => action.id !== mode
  );
  const displayText = typingState.source === output ? typingState.text : "";
  const isTyping = displayText.length < output.length;
  const copied = copiedSource === output;

  const chunkSize = useMemo(() => {
    if (output.length > 2200) return 44;
    if (output.length > 900) return 26;
    if (output.length > 320) return 14;
    return 6;
  }, [output.length]);

  useEffect(() => {
    if (!output) {
      return undefined;
    }

    let index = 0;

    const interval = window.setInterval(() => {
      index = Math.min(index + chunkSize, output.length);
      setTypingState({
        source: output,
        text: output.slice(0, index)
      });

      if (index >= output.length) {
        window.clearInterval(interval);
      }
    }, 18);

    return () => window.clearInterval(interval);
  }, [chunkSize, output]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopiedSource(output);
      window.setTimeout(() => {
        setCopiedSource((current) => (current === output ? "" : current));
      }, 1600);
    } catch {
      setCopiedSource("");
    }
  };

  const handleExport = () => {
    downloadSQLFile(output, buildSQLFilename(isSchemaMode ? "ai-schema" : `ai-sql-${mode}`));
  };

  const copyFromShortcut = useEffectEvent(() => {
    if (output.trim()) {
      handleCopy();
    }
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        copyFromShortcut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!output) {
    return null;
  }

  return (
    <div className="min-w-0 w-full">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            {isExplainMode ? <BookOpen size={14} /> : isSchemaMode ? <Database size={14} /> : <Terminal size={14} />}
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {isExplainMode ? "Explanation" : isSchemaMode ? "Generated Schema" : "Output"}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {isValidateMode ? (
            <span className="badge-accent rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
              <CheckCircle2 size={12} />
              Valid Syntax
            </span>
          ) : null}

          <button
            type="button"
            onClick={handleCopy}
            className="button-secondary inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>

          {canExport ? (
            <button
              type="button"
              onClick={handleExport}
              className="button-secondary inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]"
            >
              <Download size={13} />
              Export .sql
            </button>
          ) : null}

          {isSchemaMode && typeof onSaveSchemaResult === "function" ? (
            <button
              type="button"
              onClick={() => onSaveSchemaResult(output)}
              disabled={savingSchema}
              className="button-primary inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed"
            >
              <Database size={13} />
              {savingSchema ? "Saving" : "Save Schema"}
            </button>
          ) : null}

          {canApply ? (
            <button
              type="button"
              onClick={() => onApplyResult(output)}
              className="button-secondary inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]"
            >
              <Check size={13} />
              Apply
            </button>
          ) : null}
        </div>
      </div>

      {canSendToTool ? (
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900 sm:flex sm:flex-wrap sm:items-center">
          <span className="col-span-2 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:col-span-1">
            Continue with
          </span>
          {reviewActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onSendToTool(action.id, output)}
                className="button-secondary inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]"
              >
                <Icon size={13} />
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="code-shell min-w-0 overflow-hidden rounded-lg">
        <div className="code-toolbar flex min-w-0 items-center gap-2 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500/40" />
          <span className="mono-font ml-2 min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {isExplainMode ? "analysis.txt" : isSchemaMode ? "schema.sql" : "result.sql"}
          </span>
        </div>

        <div className="custom-scrollbar max-h-[560px] min-w-0 overflow-auto px-4 py-4 sm:px-6 sm:py-6">
          <pre
            className={`min-w-0 max-w-full whitespace-pre-wrap break-words ${
              isExplainMode
                ? "text-sm leading-7 text-slate-200"
                : "mono-font text-[13px] leading-7"
            }`}
          >
            {isExplainMode ? displayText : <SQLSyntaxHighlighter sql={displayText} />}
            {isTyping ? <span className="ml-0.5 animate-pulse text-teal-200">|</span> : null}
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
