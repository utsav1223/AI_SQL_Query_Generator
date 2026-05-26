import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, Database, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { queryService } from "../../services/queryService";

export default function Overview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [visibleRecentCount, setVisibleRecentCount] = useState(3);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await queryService.getOverview();
        setOverview(data);
      } catch (requestError) {
        setError(requestError.message || "Unable to load overview.");
      }
    };

    loadOverview();
  }, []);

  if (!overview) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-card rounded-lg p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">{error || "Loading overview..."}</p>
        </section>
      </div>
    );
  }

  const isFreePlan = overview.plan === "free";
  const usedCredits = overview.freeCreditsUsed ?? overview.usedToday ?? 0;
  const creditLimit = overview.freeCreditsLimit ?? overview.dailyLimit ?? 5;
  const remainingCredits = overview.remainingCredits ?? overview.remainingToday ?? 0;
  const recentQueries = overview.recentQueries || [];
  const visibleRecentQueries = recentQueries.slice(0, visibleRecentCount);
  const hasMoreRecentQueries = visibleRecentCount < recentQueries.length;
  const modeStats = overview.modeStats || [];
  const mostUsedTool =
    modeStats.length > 0
      ? modeStats.reduce((currentMax, item) => (item.count > currentMax.count ? item : currentMax))._id
      : "generate";

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-[var(--accent-soft-strong)] bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">
              <Sparkles size={13} />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Workspace Overview</span>
            </div>

            <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              Welcome back, {user?.name?.split(" ")[0] || "Developer"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              Review current plan, usage health, recent activity, and the fastest next action inside your SQL workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MiniPanel label="Current Plan" value={user?.plan || overview.plan} />
            <MiniPanel label="Next Step" value={isFreePlan ? "Try AI Workspace" : "Open Analytics"} />
          </div>
        </div>
      </section>

      {isFreePlan && remainingCredits === 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">Free credits are used up</h2>
              <p className="mt-2 text-sm font-medium leading-7 text-slate-700 dark:text-slate-300">
                Upgrade when you want continuous SQL generation without free-plan limits.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard/pricing")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white hover:bg-teal-700"
            >
              Upgrade Plan
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Queries" value={overview.totalQueries} helper="All saved AI requests" icon={<Database size={17} />} />
        <StatCard title="Created Today" value={overview.todayQueries} helper="Requests from the current day" icon={<Clock3 size={17} />} />
        <StatCard
          title={isFreePlan ? "Remaining Credits" : "Most Used Tool"}
          value={isFreePlan ? remainingCredits : mostUsedTool}
          helper={isFreePlan ? `${usedCredits} of ${creditLimit} used` : "Based on recent activity"}
          icon={<ShieldCheck size={17} />}
        />
        <StatCard
          title={isFreePlan ? "Credit Limit" : "Tracked Tools"}
          value={isFreePlan ? creditLimit : modeStats.length}
          helper={isFreePlan ? "Free plan allowance" : "Generate, optimize, validate, explain"}
          icon={<FileText size={17} />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="dashboard-card rounded-lg p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="dashboard-heading text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                Recent Activity
              </h2>
              <p className="mt-1 text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
                Latest prompts and generated outputs for quick review.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/history")}
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              View History
            </button>
          </div>

          {recentQueries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              No recent queries yet. Open the AI Workspace to start generating SQL.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRecentQueries.map((query) => (
                <div key={query._id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100">{query.prompt}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">{query.mode}</p>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {new Date(query.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {hasMoreRecentQueries ? (
                <button
                  type="button"
                  onClick={() => setVisibleRecentCount((count) => count + 3)}
                  className="button-secondary inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
                >
                  Load More
                  <ArrowRight size={14} />
                </button>
              ) : null}
            </div>
          )}
        </article>

        <article className="dashboard-card rounded-lg p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Quick Actions</p>
          <h2 className="dashboard-heading mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
            Move faster from here
          </h2>

          <div className="mt-5 space-y-3">
            <ActionCard title="Open AI Workspace" description="Generate or refine SQL from one focused screen." onClick={() => navigate("/dashboard/generate")} />
            <ActionCard title="Update Schema Context" description="Keep schema aligned with real tables and columns." onClick={() => navigate("/dashboard/schema")} />
            <ActionCard
              title={isFreePlan ? "Compare Pro Features" : "Review Invoices"}
              description={isFreePlan ? "See what unlocks beyond the free plan." : "Review subscription and invoice history."}
              onClick={() => navigate(isFreePlan ? "/dashboard/pricing" : "/dashboard/invoices")}
            />
          </div>
        </article>
      </section>
    </div>
  );
}

function MiniPanel({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold capitalize text-slate-950 dark:text-slate-100">{value}</p>
    </div>
  );
}

function StatCard({ title, value, helper, icon }) {
  return (
    <article className="dashboard-card rounded-lg p-5">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#10232d] text-teal-300">
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="dashboard-heading mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
        {value ?? 0}
      </h3>
      <p className="mt-2 text-[13px] font-medium leading-6 text-slate-500 dark:text-slate-400">{helper}</p>
    </article>
  );
}

function ActionCard({ title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-teal-200 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
    >
      <div>
        <p className="text-sm font-bold text-slate-950 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-[13px] font-medium leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <ArrowRight size={15} className="mt-1 shrink-0 text-[var(--accent)]" />
    </button>
  );
}
