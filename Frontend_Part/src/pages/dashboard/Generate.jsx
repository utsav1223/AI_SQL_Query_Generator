import { useEffect, useEffectEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Lock, Sparkles } from "lucide-react";
import ToolSelector from "../../components/ai/ToolSelector";
import SQLInput from "../../components/ai/SQLInput";
import SQLOutput from "../../components/ai/SQLOutput";
import AILoadingState, { AILoadingIcon } from "../../components/ai/AILoadingState";
import { SQL_DIALECT_OPTIONS } from "../../config/productConfig";
import { useAuth } from "../../hooks/useAuth";
import { aiService } from "../../services/aiService";

const PLACEHOLDERS = {
  generate: "Describe the SQL you want to generate. Example: revenue by category for 2024.",
  optimize: "Paste SQL to improve performance and readability.",
  format: "Paste SQL to clean up indentation, clause spacing, and line breaks.",
  validate: "Paste SQL to check for syntax or logic issues.",
  explain: "Paste SQL to get a simple explanation of what it does."
};

const ACTION_LABELS = {
  generate: "Generate SQL",
  optimize: "Optimize SQL",
  format: "Format SQL",
  validate: "Validate SQL",
  explain: "Explain SQL"
};

const LOADING_LABELS = {
  generate: "Generating...",
  optimize: "Optimizing...",
  format: "Formatting...",
  validate: "Validating...",
  explain: "Explaining..."
};

export default function Generate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState("generate");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialect, setDialect] = useState("standard");

  const isProFeature = mode !== "generate";
  const isLocked = user?.plan !== "pro" && isProFeature;
  const canChooseDialect = user?.plan === "pro";

  const runTool = async (selectedMode = mode) => {
    const activeMode = selectedMode;
    const activeIsLocked = user?.plan !== "pro" && activeMode !== "generate";

    if (loading) {
      return;
    }

    if (activeMode !== mode) {
      setMode(activeMode);
    }

    if (!input.trim() || activeIsLocked) {
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const selectedDialect = user?.plan === "pro" ? dialect : "standard";
      const payload =
        activeMode === "generate"
          ? { mode: activeMode, prompt: input, dialect: selectedDialect }
          : { mode: activeMode, sql: input, dialect: selectedDialect };
      const data = await aiService.runTool(payload);
      setResult(data.result || "");
    } catch (requestError) {
      setError(getAiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    runTool(mode);
  };

  const submitFromShortcut = useEffectEvent(() => {
    runTool(mode);
  });

  const formatFromShortcut = useEffectEvent(() => {
    runTool("format");
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submitFromShortcut();
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        formatFromShortcut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              AI Workspace
            </p>
            <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              Generate, improve, and understand SQL
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              Choose a tool, enter a prompt or SQL statement, and review the output in one simple workspace.
            </p>
          </div>

          <div className="badge-accent rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]">
            5 SQL tools ready
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div className="dashboard-card rounded-lg p-5 sm:p-6">
            <ToolSelector mode={mode} setMode={setMode} />
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[var(--accent)] dark:bg-slate-800">
                  <Database size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    SQL dialect
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {canChooseDialect ? "Dialect-specific SQL output" : "Standard SQL on Free"}
                  </p>
                </div>
              </div>

              <select
                value={canChooseDialect ? dialect : "standard"}
                onChange={(event) => setDialect(event.target.value)}
                disabled={!canChooseDialect || loading}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800"
              >
                {SQL_DIALECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="dashboard-card overflow-hidden rounded-lg">
            {isLocked ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 px-8 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Lock size={28} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Pro feature</h2>
                  <p className="max-w-md text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                    Upgrade to Pro to use <span className="capitalize">{mode}</span>. The free plan can still generate SQL from your saved schema.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/pricing")}
                  className="button-primary rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
                >
                  View Pricing
                </button>
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <SQLInput
                  value={input}
                  onChange={setInput}
                  mode={mode}
                  loading={loading}
                  placeholder={PLACEHOLDERS[mode]}
                />

                {error ? (
                  <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </p>
                ) : null}

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !input.trim()}
                    className="button-primary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <AILoadingIcon compact className="h-6 w-6" /> : <Sparkles size={16} />}
                    {loading ? LOADING_LABELS[mode] : ACTION_LABELS[mode]}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card rounded-lg p-5 sm:p-6">
          {loading ? (
            <AILoadingState mode={mode} />
          ) : result ? (
            <SQLOutput result={result} mode={mode} onApplyResult={mode === "format" ? setInput : undefined} />
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-8 text-center text-sm font-medium leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Run a tool to see the result here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function getAiErrorMessage(error) {
  if (error?.code === "LIMIT") {
    return "Free 5-credit limit reached. Upgrade to Pro to continue generating SQL.";
  }

  if (error?.code === "AI_PROVIDER_AUTH") {
    return "AI is unavailable because the backend Gemini key is missing or invalid. Add a valid GEMINI_API_KEY or GOOGLE_API_KEY in Render, then redeploy.";
  }

  if (error?.code === "REQUEST_TIMEOUT") {
    return "AI is taking longer than expected. Please try again, or check History because the server may still finish and save the SQL.";
  }

  return error?.message || "Unable to process your request right now.";
}
