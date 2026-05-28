import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpDown,
  Calendar,
  Check,
  Code2,
  Copy,
  Database,
  Download,
  Filter,
  History as HistoryIcon,
  Lock,
  Pin,
  PinOff,
  Save,
  Star,
  Tags,
  Trash
} from "lucide-react";
import {
  EmptyState,
  IconButton,
  Pager,
  PageHeader,
  Panel,
  SearchInput,
  SelectControl,
  SkeletonBlock,
  StatusBadge
} from "../../components/ui/DashboardUI";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";
import { useAuth } from "../../hooks/useAuth";
import { queryService } from "../../services/queryService";
import { logger } from "../../utils/logger";
import SQLSyntaxHighlighter from "../../components/ai/SQLSyntaxHighlighter";
import { buildSQLFilename, downloadSQLFile } from "../../utils/sqlExport";

export default function History() {
  const { user } = useAuth();
  const { confirmAction, ConfirmationDialog } = useConfirmationDialog();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [accessPolicy, setAccessPolicy] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);
  const [tagDrafts, setTagDrafts] = useState({});
  const [tagSavingId, setTagSavingId] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await queryService.getHistory({
        page,
        limit: pagination.limit,
        mode: modeFilter,
        search: debouncedSearch,
        sort: sortOrder
      });

      setQueries(data.queries || []);
      setAccessPolicy(data.accessPolicy || null);
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        pages: 1
      });
    } catch (err) {
      logger.error("Query history fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, modeFilter, page, pagination.limit, sortOrder]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [modeFilter, sortOrder]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    const result = await confirmAction({
      title: "Delete query history",
      description: "This saved SQL entry will be permanently deleted.",
      confirmLabel: "Delete",
      tone: "danger",
      confirmText: "DELETE"
    });
    if (!result?.confirmed) return;

    try {
      await queryService.deleteQuery(id);
      if (queries.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchHistory();
      }
    } catch (error) {
      logger.error("Query history delete failed", error, { queryId: id });
    }
  };

  const togglePin = async (id) => {
    try {
      await queryService.togglePin(id);
      await fetchHistory();
    } catch (error) {
      logger.error("Query pin update failed", error, { queryId: id });
    }
  };

  const toggleFavorite = async (id) => {
    setFavoriteLoadingId(id);
    try {
      await queryService.toggleFavorite(id);
      await fetchHistory();
    } catch (error) {
      logger.error("Query favorite update failed", error, { queryId: id });
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  const handleTagDraftChange = (id, value) => {
    setTagDrafts((current) => ({
      ...current,
      [id]: value
    }));
  };

  const saveTags = async (event, query) => {
    event.preventDefault();
    setTagSavingId(query._id);

    try {
      const draftValue = tagDrafts[query._id] ?? (query.tags || []).join(", ");
      const tags = draftValue
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await queryService.updateTags(query._id, tags);
      await fetchHistory();
    } catch (error) {
      logger.error("Query tag update failed", error, { queryId: query._id });
    } finally {
      setTagSavingId(null);
    }
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      queryService.trackAction(id, "copy").catch((error) => {
        logger.warn("Query copy tracking failed", { error, queryId: id });
      });
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      logger.warn("Clipboard copy failed", { error });
    }
  };

  const handleExport = (query) => {
    queryService.trackAction(query._id, "export").catch((error) => {
      logger.warn("Query export tracking failed", { error, queryId: query._id });
    });
    downloadSQLFile(
      query.generatedSQL || "",
      buildSQLFilename(`history-${query.mode || "query"}`)
    );
  };

  if (loading && queries.length === 0) {
    return <HistorySkeleton />;
  }

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        eyebrow="History"
        icon={Database}
        title="SQL History"
        description="Search, copy, pin, favorite, tag, and manage generated SQL from a readable workspace history."
      />

      {accessPolicy && !accessPolicy.fullHistory ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <Lock size={16} className="mt-0.5 shrink-0" />
            <p>
              Starter shows your latest {accessPolicy.visibleLimit} history entries.
              {accessPolicy.hiddenCount > 0 ? ` ${accessPolicy.hiddenCount} older entries are kept for Pro archive access.` : " Pro unlocks the full searchable archive with pins, favorites, and tags."}
            </p>
          </div>
        </section>
      ) : null}

      <section className="sticky top-[76px] z-20 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search prompts or SQL..." />

          <SelectControl icon={<Filter size={14} />} value={modeFilter} onChange={setModeFilter}>
            <option value="all">All Modes</option>
            <option value="generate">Generate</option>
            <option value="optimize">Optimize</option>
            <option value="validate">Validate</option>
            <option value="explain">Explain</option>
            <option value="format">Format</option>
          </SelectControl>

          <SelectControl icon={<ArrowUpDown size={14} />} value={sortOrder} onChange={setSortOrder}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </SelectControl>
        </div>
      </section>

      {queries.length === 0 ? (
        <EmptyState icon={HistoryIcon} eyebrow="No history found" />
      ) : (
        <section className="space-y-4">
          {queries.map((q) => (
            <Panel
              as="article"
              key={q._id}
              className={`overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-slate-900 ${
                q.pinned ? "border-amber-200 dark:border-amber-500/40" : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <StatusBadge tone="dark" icon={<Code2 size={12} className="text-teal-300" />}>
                      {q.mode}
                    </StatusBadge>
                    <StatusBadge icon={<Calendar size={12} />}>
                      {new Date(q.createdAt).toLocaleDateString()}
                    </StatusBadge>
                    {q.pinned ? (
                      <StatusBadge tone="amber" icon={<Pin size={11} fill="currentColor" />}>
                        Pinned
                      </StatusBadge>
                    ) : null}
                    {q.favorite ? (
                      <StatusBadge tone="amber" icon={<Star size={11} fill="currentColor" />}>
                        Favorite
                      </StatusBadge>
                    ) : null}
                    {q.dialect && q.dialect !== "standard" ? (
                      <StatusBadge icon={<Database size={12} />}>
                        {q.dialect}
                      </StatusBadge>
                    ) : null}
                  </div>
                  <h2 className="break-words text-base font-bold leading-7 text-slate-900 dark:text-slate-100">
                    {q.prompt}
                  </h2>
                  {q.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {q.tags.map((tag) => (
                        <span
                          key={`${q._id}-${tag}`}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Tags size={11} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {user?.plan === "pro" ? (
                    <>
                      <IconButton
                        onClick={() => toggleFavorite(q._id)}
                        label={q.favorite ? "Remove favorite" : "Favorite"}
                        disabled={favoriteLoadingId === q._id}
                      >
                        <Star size={16} fill={q.favorite ? "currentColor" : "none"} />
                      </IconButton>
                      <IconButton onClick={() => togglePin(q._id)} label={q.pinned ? "Unpin" : "Pin"}>
                        {q.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </IconButton>
                    </>
                  ) : null}
                  <IconButton onClick={() => handleDelete(q._id)} label="Delete" danger>
                    <Trash size={16} />
                  </IconButton>
                </div>
              </div>

              {user?.plan === "pro" ? (
                <form
                  onSubmit={(event) => saveTags(event, q)}
                  className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Tags size={15} className="shrink-0 text-[var(--accent)]" />
                    <input
                      value={tagDrafts[q._id] ?? (q.tags || []).join(", ")}
                      onChange={(event) => handleTagDraftChange(q._id, event.target.value)}
                      placeholder="reporting, billing, reusable"
                      className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--accent)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={tagSavingId === q._id}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
                  >
                    <Save size={13} />
                    {tagSavingId === q._id ? "Saving" : "Save Tags"}
                  </button>
                </form>
              ) : null}

              <div className="relative bg-slate-950">
                <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(q._id, q.generatedSQL)}
                    className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur hover:bg-white/20"
                  >
                    {copiedId === q._id ? <Check size={13} /> : <Copy size={13} />}
                    {copiedId === q._id ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(q)}
                    className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur hover:bg-white/20"
                  >
                    <Download size={13} />
                    Export
                  </button>
                </div>
                <pre className="mono-font max-h-[360px] overflow-auto p-4 pt-14 text-[12px] leading-6 text-emerald-100">
                  <code>
                    <SQLSyntaxHighlighter sql={q.generatedSQL || ""} />
                  </code>
                </pre>
              </div>
            </Panel>
          ))}
        </section>
      )}

      {pagination.total > 0 ? (
        <Pager
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          loading={loading}
          onPrevious={() => setPage((prev) => Math.max(prev - 1, 1))}
          onNext={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
        />
      ) : null}
      <ConfirmationDialog />
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="dashboard-page space-y-4 animate-pulse">
      <Panel className="p-5">
        <SkeletonBlock className="mb-3 h-4 w-28" />
        <SkeletonBlock className="h-8 w-72 max-w-full" />
      </Panel>
      {[1, 2, 3].map((id) => (
        <Panel key={id} className="p-5">
          <SkeletonBlock className="mb-3 h-5 w-52" />
          <SkeletonBlock className="mb-4 h-6 w-3/4" />
          <SkeletonBlock className="h-40" />
        </Panel>
      ))}
    </div>
  );
}
