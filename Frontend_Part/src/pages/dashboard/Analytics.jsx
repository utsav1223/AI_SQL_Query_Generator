import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock3,
  Database,
  Download,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  TrendingUp
} from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { queryService } from "../../services/queryService";
import { logger } from "../../utils/logger";
import { isPaidPlan } from "../../utils/planAccess";

const COLORS = ["#0f766e", "#0891b2", "#f59e0b", "#8b5cf6", "#e11d48"];

export default function Analytics() {
  const { user, loading } = useAuth();
  const { isDark } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setIsLoading(true);

      try {
        if (isPaidPlan(user.plan)) {
          const analyticsData = await queryService.getAdvancedAnalytics();
          setData(analyticsData);
          return;
        }

        const overviewData = await queryService.getOverview();
        setOverview(overviewData);
      } catch (error) {
        logger.error("Analytics fetch failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  const pieData = useMemo(() => {
    return (
      data?.modeStats?.map((item) => ({
        name: item._id || "Query",
        value: item.count
      })) || []
    );
  }, [data]);

  const lineData = useMemo(() => {
    return (
      data?.dailyStats?.map((item) => ({
        date: item._id,
        queries: item.count
      })) || []
    );
  }, [data]);

  const chartAxisColor = isDark ? "#94a3b8" : "#64748b";
  const chartGridColor = isDark ? "#243042" : "#e2e8f0";
  const chartTooltipBg = isDark ? "#0f172a" : "#ffffff";
  const chartTooltipText = isDark ? "#e5e7eb" : "#0f172a";
  const topTable = data?.schemaCoverage?.topTables?.[0];
  const paidPlan = isPaidPlan(user?.plan);

  if (loading || isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!user || !paidPlan) {
    return <FreeAnalyticsPreview overview={overview} onUpgrade={() => navigate("/dashboard/billing")} />;
  }

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
          Pro Analytics
        </p>
        <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
          Measure the value of your SQL workflow
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          Track time saved, query quality, schema usage, optimizer impact, history reuse, and weekly movement from one professional dashboard.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Estimated Time Saved"
          value={`${data?.productivity?.estimatedHoursSaved || "0.0"}h`}
          helper="Based on generated and reviewed queries"
          icon={Clock3}
          accent
        />
        <StatCard
          title="Quality Score"
          value={`${data?.quality?.score || 100}/100`}
          helper="Heuristic risk score from saved SQL"
          icon={ShieldCheck}
        />
        <StatCard
          title="Weekly Queries"
          value={data?.weeklyQueries || 0}
          helper="Requests from the last 7 days"
          icon={Activity}
        />
        <StatCard
          title="Full Archive"
          value={data?.totalQueries || 0}
          helper="All saved SQL requests"
          icon={Database}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="dashboard-card rounded-lg p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold">Activity trend</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Query volume over time
              </p>
            </div>
            <span className="badge-accent rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]">
              <Activity size={12} />
              Live Data
            </span>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartAxisColor }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartAxisColor }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartGridColor}`,
                    borderRadius: 12,
                    color: chartTooltipText
                  }}
                  labelStyle={{ color: chartTooltipText, fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="queries" stroke="#0f766e" strokeWidth={3} fill="url(#analyticsArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-card rounded-lg p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold">Tool usage</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Distribution across generate, schema, optimize, validate, explain, and format
            </p>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={92} paddingAngle={4} stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartGridColor}`,
                    borderRadius: 12,
                    color: chartTooltipText
                  }}
                  labelStyle={{ color: chartTooltipText, fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 space-y-2">
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No usage data available yet.</p>
            ) : (
              pieData.map((item, index) => (
                <div key={`${item.name}-${index}`} className="surface-card-soft flex items-center justify-between rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-semibold capitalize">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard title="Most Used Table" value={topTable?.name || "N/A"} icon={<Database size={16} />} />
        <InsightCard title="Validation Pass Rate" value={`${data?.quality?.validationPassRate || "N/A"}${data?.quality?.validationPassRate === "N/A" ? "" : "%"}`} icon={<ShieldCheck size={16} />} />
        <InsightCard title="Optimizer Usage" value={`${data?.optimizerUsagePercent || 0}%`} icon={<TrendingUp size={16} />} />
        <InsightCard title="Saved Signals" value={`${data?.productivity?.favoriteQueries || 0} favorites`} icon={<Star size={16} />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="dashboard-card rounded-lg p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Workflow signals</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric icon={Download} label="Exported" value={data?.productivity?.exportedQueries || 0} />
            <MiniMetric icon={Tags} label="Tagged" value={data?.productivity?.taggedQueries || 0} />
            <MiniMetric icon={Star} label="Favorites" value={data?.productivity?.favoriteQueries || 0} />
            <MiniMetric icon={BarChart3} label="Avg saved/query" value={`${data?.productivity?.averageMinutesSaved || "0.0"}m`} />
          </div>
        </article>

        <article className="dashboard-card rounded-lg p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Actionable insights</h2>
          <div className="mt-4 grid gap-3">
            {[...(data?.insights || []), ...(data?.schemaCoverage?.hints || [])].slice(0, 6).map((item) => (
              <div key={item} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function FreeAnalyticsPreview({ overview, onUpgrade }) {
  const creditsUsed = overview?.freeCreditsUsed ?? overview?.usedToday ?? 0;
  const creditLimit = overview?.freeCreditsLimit ?? overview?.dailyLimit ?? 5;
  const remaining = overview?.remainingCredits ?? overview?.remainingToday ?? Math.max(creditLimit - creditsUsed, 0);
  const latestMode = overview?.recentQueries?.[0]?.mode || "No query yet";

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-card rounded-lg px-5 py-8 sm:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <Lock size={28} />
        </div>
        <h1 className="dashboard-heading mt-6 text-center text-3xl font-extrabold tracking-tight">
          Pro analytics turns usage into value
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-7 text-slate-500 dark:text-slate-400">
          Free includes basic usage. Pro adds time saved, quality score, schema coverage, optimizer impact, and full history insights.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onUpgrade}
            className="button-primary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
          >
            Upgrade To Pro
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Credits Used" value={`${creditsUsed}/${creditLimit}`} helper={`${remaining} remaining`} icon={Sparkles} />
        <StatCard title="Total Queries" value={overview?.totalQueries || 0} helper="Saved in your workspace" icon={Database} />
        <StatCard title="Today" value={overview?.todayQueries || 0} helper="Requests today" icon={Activity} />
        <StatCard title="Latest Tool" value={latestMode} helper="Recent activity" icon={BarChart3} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          "Estimated time saved",
          "Query quality trends",
          "Most used tables",
          "Full history insights"
        ].map((item) => (
          <article key={item} className="dashboard-card relative min-h-[150px] overflow-hidden rounded-lg p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 to-transparent dark:from-slate-800/70" />
            <div className="relative">
              <Lock size={16} className="text-[var(--accent)]" />
              <p className="mt-4 text-sm font-extrabold text-slate-950 dark:text-slate-100">{item}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                Unlock this Pro insight when you need measurable SQL workflow value.
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function StatCard({ title, value, helper, icon, accent = false }) {
  const Icon = icon;

  return (
    <article className="dashboard-card rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {Icon ? <Icon size={16} className="text-[var(--accent)]" /> : null}
      </div>
      <p className={`dashboard-heading mt-3 text-3xl font-bold tracking-tight ${accent ? "text-[var(--accent)]" : "text-slate-950 dark:text-slate-100"}`}>
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
    </article>
  );
}

function InsightCard({ title, value, icon = null }) {
  return (
    <article className="dashboard-card rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {icon ? <span className="text-[var(--accent)]">{icon}</span> : null}
      </div>
      <p className="dashboard-heading mt-4 break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
        {value}
      </p>
    </article>
  );
}

function MiniMetric({ icon, label, value }) {
  const Icon = icon;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
      <Icon size={16} className="text-[var(--accent)]" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold text-slate-950 dark:text-slate-100">{value}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="dashboard-page space-y-6 animate-pulse">
      <div className="dashboard-card rounded-lg p-6">
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-10 w-72 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-80 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((id) => (
          <div key={id} className="dashboard-card h-36 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="dashboard-card h-[380px] rounded-lg" />
        <div className="dashboard-card h-[380px] rounded-lg" />
      </div>
    </div>
  );
}
