import { useEffect, useEffectEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Sparkles } from "lucide-react";
import ToolSelector from "../../components/ai/ToolSelector";
import SQLInput from "../../components/ai/SQLInput";
import SQLOutput from "../../components/ai/SQLOutput";
import { useAuth } from "../../hooks/useAuth";
import { aiService } from "../../services/aiService";

const PLACEHOLDERS = {
  generate: "Describe the SQL you want to generate. Example: revenue by category for 2024.",
  optimize: "Paste SQL to improve performance and readability.",
  validate: "Paste SQL to check for syntax or logic issues.",
  explain: "Paste SQL to get a simple explanation of what it does."
};

export default function Generate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState("generate");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isProFeature = mode !== "generate";
  const isLocked = user?.plan !== "pro" && isProFeature;

  const handleSubmit = async () => {
    if (!input.trim() || loading || isLocked) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = mode === "generate" ? { mode, prompt: input } : { mode, sql: input };
      const data = await aiService.runTool(payload);
      setResult(data.result || "");
    } catch (requestError) {
      setError(requestError.message || "Unable to process your request right now.");
    } finally {
      setLoading(false);
    }
  };

  const submitFromShortcut = useEffectEvent(() => {
    handleSubmit();
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submitFromShortcut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--accent)]">
              AI Workspace
            </p>
            <h1 className="dashboard-heading mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Generate, improve, and understand SQL
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Choose a tool, enter a prompt or SQL statement, and review the output in one simple workspace.
            </p>
          </div>

          <div className="badge-accent rounded-full px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em]">
            Shortcut: Ctrl/Cmd + Enter
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="dashboard-card rounded-3xl p-5 sm:p-6">
            <ToolSelector mode={mode} setMode={setMode} />
          </div>

          <div className="dashboard-card overflow-hidden rounded-3xl">
            {isLocked ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 px-8 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Lock size={28} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold">Pro feature</h2>
                  <p className="max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                    Upgrade to Pro to use <span className="capitalize">{mode}</span>. The free plan can still generate SQL from your saved schema.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/pricing")}
                  className="button-primary rounded-xl px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em]"
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
                  <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </p>
                ) : null}

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !input.trim()}
                    className="button-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {loading ? "Working..." : "Run Tool"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card rounded-3xl p-5 sm:p-6">
          {result ? (
            <SQLOutput result={result} mode={mode} />
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-8 text-center text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Run a tool to see the result here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
