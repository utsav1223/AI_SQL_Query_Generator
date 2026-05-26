import { useEffect, useState } from "react";
import { Database, Loader2, RotateCcw, Save } from "lucide-react";
import { schemaService } from "../../services/schemaService";

const MAX_SCHEMA_SIZE_BYTES = 20000;

export default function Schema() {
  const [schemaText, setSchemaText] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [size, setSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const data = await schemaService.getSchema();
        setSchemaText(data.schemaText || "");
        setLastUpdated(data.lastUpdated || null);
        setSize(data.size || 0);
      } catch (requestError) {
        setError(requestError.message || "Unable to load schema.");
      } finally {
        setLoading(false);
      }
    };

    loadSchema();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const data = await schemaService.saveSchema(schemaText);
      setLastUpdated(data.lastUpdated || null);
      setSize(data.size || 0);
      setMessage("Schema saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save schema.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear the saved schema?")) {
      return;
    }

    setClearing(true);
    setMessage("");
    setError("");

    try {
      await schemaService.deleteSchema();
      setSchemaText("");
      setLastUpdated(null);
      setSize(0);
      setMessage("Schema cleared successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to clear schema.");
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-card rounded-lg p-5">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{error || "Loading schema..."}</p>
        </section>
      </div>
    );
  }

  const usedKb = (size / 1024).toFixed(2);
  const maxKb = (MAX_SCHEMA_SIZE_BYTES / 1024).toFixed(2);
  const usagePercent = Math.min((size / MAX_SCHEMA_SIZE_BYTES) * 100, 100);

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[var(--accent-soft-strong)] bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">
              <Database size={13} />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Schema Context</span>
            </div>
            <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              Database schema
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              Save DDL, table names, columns, keys, and relationships so generated SQL matches your real database.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="button-secondary inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearing ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="button-primary inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Schema
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Saved Size" value={`${usedKb} KB`} helper={`Limit: ${maxKb} KB`} icon={<Database size={17} />} />
        <InfoCard
          title="Last Updated"
          value={lastUpdated ? new Date(lastUpdated).toLocaleString() : "Not saved yet"}
          helper="Updates after every successful save"
          icon={<Save size={17} />}
        />
        <InfoCard
          title="Usage"
          value={`${usagePercent.toFixed(0)}%`}
          helper="Keep schema context focused"
          icon={<RotateCcw size={17} />}
        />
      </section>

      <section className="dashboard-card overflow-hidden rounded-lg">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Schema Editor</h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Paste SQL DDL or notes the AI should follow.
            </p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {usedKb} KB Used
          </p>
        </div>

        <textarea
          value={schemaText}
          onChange={(event) => setSchemaText(event.target.value)}
          placeholder={`Example:
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);`}
          className="min-h-[420px] w-full resize-y bg-white p-5 font-mono text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </section>

      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
    </div>
  );
}

function InfoCard({ title, value, helper, icon }) {
  return (
    <article className="dashboard-card rounded-lg p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#10232d] text-teal-300">
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</p>
      <h2 className="dashboard-heading mt-2 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
        {value}
      </h2>
      <p className="mt-2 text-[13px] font-medium leading-6 text-slate-500 dark:text-slate-400">{helper}</p>
    </article>
  );
}

function StatusMessage({ tone, children }) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";

  return <p className={`rounded-lg border px-4 py-3 text-sm font-semibold ${styles}`}>{children}</p>;
}
