import { useEffect, useEffectEvent, useState } from "react";
import { useOrganization } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Database, Lock, Sparkles } from "lucide-react";
import ToolSelector from "../../components/ai/ToolSelector";
import SQLInput from "../../components/ai/SQLInput";
import SQLOutput from "../../components/ai/SQLOutput";
import AILoadingState, { AILoadingIcon } from "../../components/ai/AILoadingState";
import { SQL_DIALECT_OPTIONS } from "../../config/productConfig";
import { useAuth } from "../../hooks/useAuth";
import { aiService } from "../../services/aiService";
import { schemaService } from "../../services/schemaService";
import { isPaidPlan } from "../../utils/planAccess";

const PLACEHOLDERS = {
  generate: "Describe the SQL you want to generate. Example: revenue by category for 2024.",
  schema: "Describe the app or database you want. Example: multi-tenant CRM with contacts, deals, notes, tasks, and audit logs.",
  optimize: "Paste SQL to improve performance and readability.",
  format: "Paste SQL to clean up indentation, clause spacing, and line breaks.",
  validate: "Paste SQL to check for syntax or logic issues.",
  explain: "Paste SQL to get a simple explanation of what it does."
};

const ACTION_LABELS = {
  generate: "Generate SQL",
  schema: "Generate Schema",
  optimize: "Optimize SQL",
  format: "Format SQL",
  validate: "Validate SQL",
  explain: "Explain SQL"
};

const LOADING_LABELS = {
  generate: "Generating...",
  schema: "Generating Schema...",
  optimize: "Optimizing...",
  format: "Formatting...",
  validate: "Validating...",
  explain: "Explaining..."
};

export default function Generate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, isLoaded: organizationLoaded } = useOrganization();
  const [mode, setMode] = useState("generate");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialect, setDialect] = useState("standard");
  const [schemaSummary, setSchemaSummary] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [savingGeneratedSchema, setSavingGeneratedSchema] = useState(false);
  const [notice, setNotice] = useState("");

  const paidPlan = isPaidPlan(user?.plan);
  const isProFeature = mode !== "generate";
  const isLocked = !paidPlan && isProFeature;
  const canChooseDialect = paidPlan;
  const workspaceKey = organization?.id || "personal";
  const workspaceLabel = organization?.name || "Personal workspace";
  const hasSavedSchema = Boolean(schemaSummary?.size);

  useEffect(() => {
    if (!organizationLoaded) {
      return undefined;
    }

    let isCurrent = true;

    const loadSchemaSummary = async () => {
      setSchemaLoading(true);

      try {
        const data = await schemaService.getSchema();
        if (isCurrent) {
          setSchemaSummary(data);
        }
      } catch {
        if (isCurrent) {
          setSchemaSummary(null);
        }
      } finally {
        if (isCurrent) {
          setSchemaLoading(false);
        }
      }
    };

    loadSchemaSummary();

    return () => {
      isCurrent = false;
    };
  }, [organizationLoaded, workspaceKey]);

  const runTool = async (selectedMode = mode, options = {}) => {
    const activeMode = selectedMode;
    const activeIsLocked = !paidPlan && activeMode !== "generate";
    const activeInput = options.inputOverride ?? input;

    if (loading) {
      return;
    }

    if (activeMode !== mode) {
      setMode(activeMode);
    }

    if (options.inputOverride !== undefined) {
      setInput(options.inputOverride);
    }

    if (!activeInput.trim() || activeIsLocked) {
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    setResult("");

    try {
      const selectedDialect = paidPlan ? dialect : "standard";
      const payload =
        activeMode === "generate" || activeMode === "schema"
          ? { mode: activeMode, prompt: activeInput, dialect: selectedDialect }
          : { mode: activeMode, sql: activeInput, dialect: selectedDialect };
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

  const handleSendResultToTool = (targetMode, sourceSql) => {
    runTool(targetMode, { inputOverride: sourceSql });
  };

  const handleSaveGeneratedSchema = async (schemaText) => {
    if (!schemaText.trim()) {
      return;
    }

    setSavingGeneratedSchema(true);
    setError("");
    setNotice("");

    try {
      const data = await schemaService.saveSchema(schemaText);
      setSchemaSummary({
        schemaText,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        size: data.size || schemaText.length
      });
      setNotice(`Generated schema saved to ${workspaceLabel}.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to save generated schema.");
    } finally {
      setSavingGeneratedSchema(false);
    }
  };

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
    <div className="dashboard-page max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              AI Workspace
            </p>
            <h1 className="dashboard-heading mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              Generate, improve, and understand SQL
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              Choose a tool, enter a prompt or SQL statement, then continue from the output into optimize, format, validate, or explain.
            </p>
          </div>

          <div className="badge-accent w-fit rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]">
            6 AI tools ready
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="min-w-0 space-y-4">
          <div className="dashboard-card rounded-lg p-5 sm:p-6">
            <ToolSelector mode={mode} setMode={setMode} paidPlan={paidPlan} />
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
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800 sm:w-auto"
              >
                {SQL_DIALECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`mt-4 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                hasSavedSchema
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                    hasSavedSchema
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
                  }`}
                >
                  {hasSavedSchema ? <CheckCircle2 size={16} /> : <Database size={16} />}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
                    {hasSavedSchema ? "Schema context saved" : "No saved schema context"}
                  </p>
                  <p className="truncate text-sm font-semibold opacity-90">
                    {schemaLoading
                      ? "Checking workspace schema..."
                      : hasSavedSchema
                        ? `${workspaceLabel} - ${(schemaSummary.size / 1024).toFixed(2)} KB active`
                        : `${workspaceLabel} - add schema for better generated SQL`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/dashboard/schema")}
                className={hasSavedSchema
                  ? "button-secondary inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] sm:w-auto"
                  : "button-primary inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] sm:w-auto"}
              >
                Schema Context
              </button>
            </div>
          </div>

          <div className="dashboard-card overflow-hidden rounded-lg">
            {isLocked ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 px-8 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Lock size={28} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Paid plan feature</h2>
                  <p className="max-w-md text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                    Upgrade to use <span className="capitalize">{mode}</span>. The free plan can still generate SQL queries from your saved schema.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/billing")}
                  className="button-primary rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
                >
                  View Billing
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
                {notice ? (
                  <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
                    {notice}
                  </p>
                ) : null}

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !input.trim()}
                    className="button-primary inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {loading ? <AILoadingIcon compact className="h-6 w-6" /> : <Sparkles size={16} />}
                    {loading ? LOADING_LABELS[mode] : ACTION_LABELS[mode]}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card min-w-0 rounded-lg p-5 sm:p-6">
          {loading ? (
            <AILoadingState mode={mode} />
          ) : result ? (
            <SQLOutput
              result={result}
              mode={mode}
              onApplyResult={mode === "format" ? setInput : undefined}
              onSendToTool={handleSendResultToTool}
              onSaveSchemaResult={mode === "schema" ? handleSaveGeneratedSchema : undefined}
              savingSchema={savingGeneratedSchema}
            />
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
    return "Free 5-credit limit reached. Upgrade to continue generating SQL.";
  }

  if (error?.code === "AI_PROVIDER_AUTH") {
    if (error?.data?.providerMessage) {
      return `Gemini rejected the backend API key: ${error.data.providerMessage}`;
    }

    return "AI is unavailable because the backend Gemini key is missing or invalid. Add a valid GEMINI_API_KEY or GOOGLE_API_KEY in Render, then redeploy.";
  }

  if (error?.code === "AI_PROVIDER_MODEL") {
    return "The selected Gemini model is not available for this API key. Set GEMINI_MODEL in the backend to a model enabled in Google AI Studio, then restart the backend.";
  }

  if (error?.code === "AI_PROVIDER_CONTEXT") {
    return "Your prompt or saved schema is too large for the AI provider. Shorten the prompt or keep only the relevant tables in Schema Context.";
  }

  if (error?.code === "AI_PROVIDER_REQUEST") {
    if (error?.data?.providerMessage) {
      return `Gemini rejected the request: ${error.data.providerMessage}`;
    }

    return "The AI provider rejected this request even after a relaxed retry. Check that your saved schema has the tables and columns needed for the prompt.";
  }

  if (error?.code === "AI_PROVIDER_QUOTA") {
    return "Gemini quota or rate limit was reached. Wait a little, check your Google AI Studio quota, or use another API key.";
  }

  if (error?.code === "REQUEST_TIMEOUT") {
    return "AI is taking longer than expected. Please try again, or check History because the server may still finish and save the SQL.";
  }

  return error?.message || "Unable to process your request right now.";
}
