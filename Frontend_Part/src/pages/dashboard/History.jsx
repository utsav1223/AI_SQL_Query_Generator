import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpDown,
  Calendar,
  Check,
  Code2,
  Copy,
  Database,
  Filter,
  History as HistoryIcon,
  Pin,
  PinOff,
  Search,
  Trash
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { queryService } from "../../services/queryService";

export default function History() {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [copiedId, setCopiedId] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await queryService.getHistory();
      setQueries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let data = [...queries];
    if (modeFilter !== "all") data = data.filter((q) => q.mode === modeFilter);
    if (search.trim()) {
      data = data.filter(
        (q) =>
          q.prompt?.toLowerCase().includes(search.toLowerCase()) ||
          q.generatedSQL?.toLowerCase().includes(search.toLowerCase())
      );
    }
    data.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    setFilteredQueries(data);
  }, [modeFilter, queries, search, sortOrder]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Permanent deletion cannot be undone. Proceed?")) return;
    try {
      await queryService.deleteQuery(id);
      setQueries((prev) => prev.filter((q) => q._id !== id));
    } catch {
      console.error("Delete failed");
    }
  };

  const togglePin = async (id) => {
    try {
      await queryService.togglePin(id);
      setQueries((prev) => prev.map((q) => (q._id === id ? { ...q, pinned: !q.pinned } : q)));
    } catch {
      console.error("Pinning failed");
    }
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error("Failed to copy text");
    }
  };

  if (loading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="dashboard-page space-y-6">
      <header className="border-b border-slate-100 pb-6 dark:border-slate-800">
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
          <Database size={14} className="text-emerald-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">History</span>
        </div>
        <h1 className="dashboard-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
          SQL History
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
          Search, copy, pin, and manage generated SQL from a readable workspace history.
        </p>
      </header>

      <section className="sticky top-[76px] z-20 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search prompts or SQL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <SelectControl icon={<Filter size={14} />} value={modeFilter} onChange={setModeFilter}>
            <option value="all">All Modes</option>
            <option value="generate">Generate</option>
            <option value="optimize">Optimize</option>
            <option value="validate">Validate</option>
            <option value="explain">Explain</option>
          </SelectControl>

          <SelectControl icon={<ArrowUpDown size={14} />} value={sortOrder} onChange={setSortOrder}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </SelectControl>
        </div>
      </section>

      {filteredQueries.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-300 dark:bg-slate-950">
            <HistoryIcon size={24} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">No history found</p>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredQueries.map((q) => (
            <article
              key={q._id}
              className={`overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-slate-900 ${
                q.pinned ? "border-amber-200 dark:border-amber-500/40" : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                      <Code2 size={12} className="text-teal-300" />
                      {q.mode}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700">
                      <Calendar size={12} />
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                    {q.pinned ? (
                      <span className="inline-flex items-center gap-2 rounded-md bg-amber-100 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                        <Pin size={11} fill="currentColor" />
                        Pinned
                      </span>
                    ) : null}
                  </div>
                  <h2 className="break-words text-base font-bold leading-7 text-slate-900 dark:text-slate-100">
                    {q.prompt}
                  </h2>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {user?.plan === "pro" ? (
                    <IconButton onClick={() => togglePin(q._id)} label={q.pinned ? "Unpin" : "Pin"}>
                      {q.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </IconButton>
                  ) : null}
                  <IconButton onClick={() => handleDelete(q._id)} label="Delete" danger>
                    <Trash size={16} />
                  </IconButton>
                </div>
              </div>

              <div className="relative bg-slate-950">
                <button
                  type="button"
                  onClick={() => handleCopy(q._id, q.generatedSQL)}
                  className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur hover:bg-white/20"
                >
                  {copiedId === q._id ? <Check size={13} /> : <Copy size={13} />}
                  {copiedId === q._id ? "Copied" : "Copy"}
                </button>
                <pre className="mono-font max-h-[360px] overflow-auto p-4 pt-14 text-[12px] leading-6 text-emerald-100">
                  <code>{q.generatedSQL}</code>
                </pre>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function SelectControl({ icon, value, onChange, children }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
      <span className="text-slate-400">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 outline-none dark:text-slate-200"
      >
        {children}
      </select>
    </label>
  );
}

function IconButton({ onClick, label, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-all ${
        danger
          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
          : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function HistorySkeleton() {
  return (
    <div className="dashboard-page space-y-4 animate-pulse">
      <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-72 max-w-full rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      {[1, 2, 3].map((id) => (
        <div key={id} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 h-5 w-52 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mb-4 h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-40 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}
