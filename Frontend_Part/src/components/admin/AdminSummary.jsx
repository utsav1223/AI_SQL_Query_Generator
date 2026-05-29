import { createElement } from "react";
import {
  BadgeIndianRupee,
  Crown,
  MessageSquareText,
  ShieldAlert,
  UserRoundPlus,
  Users
} from "lucide-react";

export function AdminSummary({ admin, overview, loadingOverview, proPercent, isDark, surfaceClass }) {
  return (
    <>
      <section className={`rounded-lg border p-4 shadow-sm ${surfaceClass}`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <SummaryMetric isDark={isDark} label="Admin" value={admin?.id || "active session"} />
          <SummaryMetric isDark={isDark} label="Conversion" value={`${proPercent}% paid`} />
          <SummaryMetric isDark={isDark} label="Open Feedback" value={overview.stats.pendingFeedback || 0} tone="amber" />
          <SummaryMetric isDark={isDark} label="Security Queue" value={overview.stats.pendingSecurityEvents || 0} tone="rose" />
          <SummaryMetric isDark={isDark} label="Access Requests" value={overview.stats.pendingAccessAppeals || 0} tone="amber" />
          <SummaryMetric isDark={isDark} label="Announcements" value={overview.stats.publishedNotifications || 0} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          isDark={isDark}
          title="Total Users"
          value={loadingOverview ? "..." : overview.stats.totalUsers}
          subtitle="All registered accounts"
          icon={Users}
        />
        <StatCard
          isDark={isDark}
          title="Paid Users"
          value={loadingOverview ? "..." : overview.stats.proUsers}
          subtitle={`${proPercent}% of users`}
          icon={Crown}
          accent="emerald"
        />
        <StatCard
          isDark={isDark}
          title="Total Queries"
          value={loadingOverview ? "..." : overview.stats.totalQueries}
          subtitle="All-time generated SQL"
          icon={UserRoundPlus}
        />
        <StatCard
          isDark={isDark}
          title="Revenue (INR)"
          value={loadingOverview ? "..." : overview.stats.totalRevenue}
          subtitle={`Invoices: ${overview.stats.totalInvoices || 0}`}
          icon={BadgeIndianRupee}
          accent="blue"
        />
        <StatCard
          isDark={isDark}
          title="Feedback"
          value={loadingOverview ? "..." : overview.stats.totalFeedback}
          subtitle={`Pending: ${overview.stats.pendingFeedback || 0}`}
          icon={MessageSquareText}
          accent="amber"
        />
        <StatCard
          isDark={isDark}
          title="Security Events"
          value={loadingOverview ? "..." : overview.stats.pendingSecurityEvents}
          subtitle={`High severity (6m): ${overview.stats.recentHighSeverityEvents || 0}`}
          icon={ShieldAlert}
          accent="rose"
        />
      </section>
    </>
  );
}

function StatCard({ title, value, subtitle, icon, accent = "slate", isDark }) {
  const accentClassMap = {
    slate: isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700"
  };

  return (
    <article className={`rounded-lg border p-5 shadow-sm ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
      <div className="mb-4 flex items-center justify-between">
        <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? "text-slate-300" : "text-slate-500"}`}>
          {title}
        </p>
        <span className={`rounded-md p-2 ${accentClassMap[accent] || accentClassMap.slate}`}>
          {icon ? createElement(icon, { size: 16 }) : null}
        </span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
      <p className={`mt-2 text-[13px] font-medium leading-6 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
        {subtitle}
      </p>
    </article>
  );
}

function SummaryMetric({ label, value, tone = "slate", isDark }) {
  const toneClassMap = {
    slate: isDark ? "text-slate-100" : "text-slate-900",
    amber: "text-amber-500",
    rose: "text-rose-500"
  };

  return (
    <div className={`rounded-lg border px-4 py-3 ${isDark ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-slate-50"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-bold ${toneClassMap[tone] || toneClassMap.slate}`}>{value}</p>
    </div>
  );
}
