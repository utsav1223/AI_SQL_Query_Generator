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
      <div className="dashboard-page rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">{error || "Loading schema..."}</p>
      </div>
    );
  }

  const usedKb = (size / 1024).toFixed(2);
  const maxKb = (MAX_SCHEMA_SIZE_BYTES / 1024).toFixed(2);
  const usagePercent = Math.min((size / MAX_SCHEMA_SIZE_BYTES) * 100, 100);

  return (
    <div className="dashboard-page space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Schema Context
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Save the database structure your AI tools should follow
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Paste DDL such as <code>CREATE TABLE</code>, <code>ALTER TABLE</code>, and
              foreign keys. This helps the SQL generator stay close to your real database.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleClear}
              disabled={clearing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearing ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              Clear
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save schema
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <InfoCard
          title="Saved Size"
          value={`${usedKb} KB`}
          helper={`Limit: ${maxKb} KB`}
          icon={<Database size={18} />}
        />
        <InfoCard
          title="Last Updated"
          value={lastUpdated ? new Date(lastUpdated).toLocaleString() : "Not saved yet"}
          helper="This updates after every successful save"
          icon={<Save size={18} />}
        />
        <InfoCard
          title="Usage"
          value={`${usagePercent.toFixed(0)}%`}
          helper="Keep the schema focused on the tables you actually use"
          icon={<RotateCcw size={18} />}
        />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Schema Editor
          </p>
        </div>

        <textarea
          value={schemaText}
          onChange={(event) => setSchemaText(event.target.value)}
          placeholder="Example:
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);"
          className="min-h-[480px] w-full resize-none p-6 font-mono text-sm text-slate-800 focus:outline-none"
        />
      </section>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function InfoCard({ title, value, helper, icon }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</h2>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
