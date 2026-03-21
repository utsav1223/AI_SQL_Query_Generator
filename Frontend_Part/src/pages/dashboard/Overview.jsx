import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  Database,
  FileText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { queryService } from "../../services/queryService";

export default function Overview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

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
        <section className="dashboard-card rounded-[2rem] p-8">
          <p className="text-sm text-slate-500">{error || "Loading overview..."}</p>
        </section>
      </div>
    );
  }

  const isFreePlan = overview.plan === "free";
  const usedCredits = overview.freeCreditsUsed ?? overview.usedToday ?? 0;
  const creditLimit = overview.freeCreditsLimit ?? overview.dailyLimit ?? 5;
  const remainingCredits = overview.remainingCredits ?? overview.remainingToday ?? 0;
  const recentQueries = overview.recentQueries || [];
  const modeStats = overview.modeStats || [];
  const mostUsedTool =
    modeStats.length > 0
      ? modeStats.reduce((currentMax, item) => (item.count > currentMax.count ? item : currentMax))
          ._id
      : "generate";

  return (
    <div className="dashboard-page space-y-8">
      <section className="dashboard-card relative overflow-hidden rounded-[2rem] p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#0f766e]/8 blur-3xl" />
        <div className="absolute -left-6 bottom-0 h-36 w-36 rounded-full bg-[#c76b2d]/8 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0f766e]/12 bg-[#0f766e]/6 px-4 py-2 text-[#0f766e]">
              <Sparkles size={14} />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">
                Workspace Overview
              </span>
            </div>

            <h1 className="dashboard-heading mt-5 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
              Welcome back, {user?.name?.split(" ")[0] || "Developer"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600">
              This screen gives you the clean summary: current plan, recent activity,
              usage health, and the fastest next steps inside your SQL workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-slate-900/8 bg-white/80 px-5 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Current Plan
              </p>
              <p className="mt-2 text-lg font-bold capitalize text-slate-950">
                {user?.plan || overview.plan}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-slate-900/8 bg-white/80 px-5 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Suggested Next Step
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {isFreePlan ? "Try AI Workspace" : "Open Analytics"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {isFreePlan && remainingCredits === 0 ? (
        <section className="dashboard-card rounded-[2rem] border-amber-200 bg-amber-50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Free credits are used up</h2>
              <p className="mt-2 text-sm font-medium leading-7 text-slate-700">
                Upgrade when you want continuous SQL generation without free-plan limits.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard/pricing")}
              className="inline-flex items-center gap-2 rounded-full bg-[#112129] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f766e]"
            >
              Upgrade Plan
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Queries"
          value={overview.totalQueries}
          helper="All saved AI requests"
          icon={<Database size={18} />}
        />
        <StatCard
          title="Created Today"
          value={overview.todayQueries}
          helper="Requests from the current day"
          icon={<Clock3 size={18} />}
        />
        <StatCard
          title={isFreePlan ? "Remaining Credits" : "Most Used Tool"}
          value={isFreePlan ? remainingCredits : mostUsedTool}
          helper={
            isFreePlan ? `${usedCredits} of ${creditLimit} used` : "Based on your recent activity"
          }
          icon={<ShieldCheck size={18} />}
        />
        <StatCard
          title={isFreePlan ? "Daily Credit Limit" : "Tracked Tools"}
          value={isFreePlan ? creditLimit : modeStats.length}
          helper={isFreePlan ? "Free plan daily allowance" : "Generate, optimize, validate, explain"}
          icon={<FileText size={18} />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="dashboard-card rounded-[2rem] p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="dashboard-heading text-2xl font-extrabold tracking-tight text-slate-950">
                Recent Activity
              </h2>
              <p className="mt-2 text-sm font-medium leading-7 text-slate-500">
                Your latest prompts and generated outputs appear here for quick review.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/history")}
              className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e] transition-colors hover:text-[#0a4f4a]"
            >
              View History
            </button>
          </div>

          {recentQueries.length === 0 ? (
            <div className="rounded-[1.6rem] border border-slate-900/8 bg-slate-50/80 px-5 py-5 text-sm font-medium leading-7 text-slate-500">
              No recent queries yet. Open the AI Workspace to start generating SQL.
            </div>
          ) : (
            <div className="space-y-3">
              {recentQueries.map((query) => (
                <div
                  key={query._id}
                  className="rounded-[1.6rem] border border-slate-900/8 bg-white/80 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-[#0f766e]/20"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold leading-7 text-slate-900">{query.prompt}</p>
                      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]">
                        {query.mode}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      {new Date(query.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-card rounded-[2rem] p-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#0f766e]">
            Quick Actions
          </p>
          <h2 className="dashboard-heading mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
            Move faster from here
          </h2>

          <div className="mt-6 space-y-3">
            <ActionCard
              title="Open AI Workspace"
              description="Generate or refine SQL from one focused screen."
              onClick={() => navigate("/dashboard/generate")}
            />
            <ActionCard
              title="Update Schema Context"
              description="Keep your saved schema aligned with real tables and columns."
              onClick={() => navigate("/dashboard/schema")}
            />
            <ActionCard
              title={isFreePlan ? "Compare Pro Features" : "Review Billing Records"}
              description={
                isFreePlan
                  ? "See what unlocks when you move beyond the free plan."
                  : "Open invoices and review subscription history."
              }
              onClick={() =>
                navigate(isFreePlan ? "/dashboard/pricing" : "/dashboard/invoices")
              }
            />
          </div>
        </article>
      </section>
    </div>
  );
}

function StatCard({ title, value, helper, icon }) {
  return (
    <article className="dashboard-card rounded-[1.8rem] p-6">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-[#112129] text-[#8fe1cf]">
        {icon}
      </div>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>
      <h3 className="dashboard-heading mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
        {value ?? 0}
      </h3>
      <p className="mt-2 text-sm font-medium leading-7 text-slate-500">{helper}</p>
    </article>
  );
}

function ActionCard({ title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between gap-4 rounded-[1.5rem] border border-slate-900/8 bg-white/75 px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#0f766e]/20"
    >
      <div>
        <p className="text-sm font-bold text-slate-950">{title}</p>
        <p className="mt-1 text-sm font-medium leading-7 text-slate-500">{description}</p>
      </div>
      <ArrowRight size={16} className="mt-1 shrink-0 text-[#0f766e]" />
    </button>
  );
}
