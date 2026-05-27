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
import { Activity, ArrowRight, BarChart3, Lock, TrendingUp } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { queryService } from "../../services/queryService";
import { logger } from "../../utils/logger";

const COLORS = ["#0f766e", "#0891b2", "#f59e0b", "#8b5cf6"];

export default function Analytics() {
  const { user, loading } = useAuth();
  const { isDark } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.plan !== "pro") {
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const analyticsData = await queryService.getAdvancedAnalytics();
        setData(analyticsData);
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

  if (loading || (user?.plan === "pro" && isLoading)) {
    return <AnalyticsSkeleton />;
  }

  if (!user || user.plan !== "pro") {
    return (
      <div className="dashboard-page">
        <section className="dashboard-card rounded-lg px-5 py-10 text-center sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Lock size={28} />
          </div>
          <h1 className="dashboard-heading mt-6 text-3xl font-extrabold tracking-tight">
            Analytics is available on Pro
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            Upgrade to see growth trends, tool usage, weekly movement, and activity summaries in one place.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/pricing")}
            className="button-primary mt-6 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
          >
            Upgrade To Pro
            <ArrowRight size={14} />
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
          Analytics
        </p>
        <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
          Clear usage insights for your SQL workspace
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          Review total activity, query patterns, tool distribution, and weekly growth without the extra visual noise.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Queries" value={data?.totalQueries || 0} helper="All tracked requests" />
        <StatCard title="Weekly Queries" value={data?.weeklyQueries || 0} helper="Requests from the last 7 days" />
        <StatCard title="Average Per Day" value={data?.avgPerDay || 0} helper="Average daily usage" />
        <StatCard title="Growth" value={`${data?.growth || 0}%`} helper="Compared with the previous week" accent />
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
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: chartAxisColor }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: chartAxisColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartGridColor}`,
                    borderRadius: 12,
                    color: chartTooltipText
                  }}
                  labelStyle={{ color: chartTooltipText, fontWeight: 700 }}
                />
                <Area
                  type="monotone"
                  dataKey="queries"
                  stroke="#0f766e"
                  strokeWidth={3}
                  fill="url(#analyticsArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-card rounded-lg p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold">Tool usage</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Distribution across generate, optimize, explain, and validate
            </p>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={92}
                  paddingAngle={4}
                  stroke="none"
                >
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
                <div
                  key={`${item.name}-${index}`}
                  className="surface-card-soft flex items-center justify-between rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
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
        <InsightCard title="Peak Day" value={data?.peakDay?._id || "N/A"} />
        <InsightCard title="Most Used Tool" value={data?.mostActiveTool || "N/A"} />
        <InsightCard title="Optimizer Usage" value={`${data?.optimizerUsagePercent || 0}%`} />
        <InsightCard title="User Level" value={data?.userLevel || "Starter"} icon={<TrendingUp size={16} />} />
      </section>
    </div>
  );
}

function StatCard({ title, value, helper, accent = false }) {
  return (
    <article className="dashboard-card rounded-lg p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
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
      <p className="dashboard-heading mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">{value}</p>
    </article>
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
