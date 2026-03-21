import { useEffect, useEffectEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Sparkles } from "lucide-react";
import ToolSelector from "../../components/ai/ToolSelector";
import SQLInput from "../../components/ai/SQLInput";
import SQLOutput from "../../components/ai/SQLOutput";
import { useAuth } from "../../hooks/useAuth";
import { aiService } from "../../services/aiService";

const PLACEHOLDERS = {
  generate: "Describe the SQL you want to generate. Example: Revenue by category for 2024.",
  optimize: "Paste SQL to improve performance and readability.",
  validate: "Paste SQL to check for obvious syntax or logic problems.",
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
      const payload =
        mode === "generate"
          ? { mode, prompt: input }
          : { mode, sql: input };

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
    <div className="dashboard-page space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              SQL Workspace
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Generate, improve, and understand SQL in one place
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Pick a tool, enter your prompt or SQL, and review the result on the right.
              The free plan supports generation, while Pro unlocks optimize, validate, and explain.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
            Shortcut: <span className="font-black text-slate-900">Ctrl/Cmd + Enter</span>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <ToolSelector mode={mode} setMode={setMode} />
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            {isLocked ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 px-8 py-12 text-center">
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  <Lock size={28} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Pro feature</h2>
                  <p className="max-w-md text-sm text-slate-600">
                    Upgrade to Pro to use <span className="capitalize">{mode}</span>. The
                    free plan can still generate SQL from your saved schema.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/dashboard/pricing")}
                  className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
                >
                  View pricing
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                <SQLInput
                  value={input}
                  onChange={setInput}
                  mode={mode}
                  loading={loading}
                  placeholder={PLACEHOLDERS[mode]}
                  className="min-h-[360px] w-full p-8 text-base focus:outline-none"
                />

                <div className="border-t border-slate-200 bg-slate-50 px-8 py-6">
                  {error ? (
                    <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {error}
                    </p>
                  ) : null}

                  <button
                    onClick={handleSubmit}
                    disabled={loading || !input.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {loading ? "Working..." : "Run tool"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-slate-950 shadow-sm">
          <div className="border-b border-slate-800 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Output
            </p>
          </div>

          <div className="min-h-[520px] p-6">
            {result ? (
              <SQLOutput result={result} />
            ) : (
              <div className="flex min-h-[460px] items-center justify-center text-center text-sm text-slate-400">
                Run a tool to see the result here.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
