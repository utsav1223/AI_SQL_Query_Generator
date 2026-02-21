import { createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeIndianRupee,
  CheckCircle2,
  Crown,
  Filter,
  LogOut,
  MessageSquareText,
  Moon,
  RefreshCw,
  Search,
  Sun,
  UserRoundPlus,
  Users
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AdminAuthContext } from "../../context/AdminAuthContext";
import { adminApiRequest } from "../../services/adminApi";
import { ThemeContext } from "../../context/ThemeContext";

const initialOverview = {
  stats: {
    totalUsers: 0,
    proUsers: 0,
    freeUsers: 0,
    totalQueries: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    totalFeedback: 0,
    avgFeedbackRating: 0,
    pendingFeedback: 0
  },
  charts: {
    monthlyBusiness: [],
    feedbackStatus: [],
    planDistribution: []
  },
  recentUsers: [],
  recentInvoices: [],
  recentFeedback: []
};

const FEEDBACK_STATUSES = ["all", "new", "reviewed", "resolved"];

export default function AdminDashboard() {
  const { admin, logout } = useContext(AdminAuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [overview, setOverview] = useState(initialOverview);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [usersSearchInput, setUsersSearchInput] = useState("");
  const [usersSearchQuery, setUsersSearchQuery] = useState("");

  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackPagination, setFeedbackPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [feedbackStatus, setFeedbackStatus] = useState("all");
  const [feedbackSearchInput, setFeedbackSearchInput] = useState("");
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState("");

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [actioningId, setActioningId] = useState("");
  const [error, setError] = useState("");

  const surfaceClass = isDark
    ? "bg-slate-900 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";

  const mutedTextClass = isDark ? "text-slate-300" : "text-slate-500";
  const subtleBgClass = isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200";
  const inputClass = isDark
    ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20"
    : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100";

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await adminApiRequest("/admin/overview", "GET");
      setOverview(data);
    } catch (err) {
      setError(err.message || "Failed to load overview");
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1, query = "") => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(query ? { search: query } : {})
      });

      const data = await adminApiRequest(`/admin/users?${params.toString()}`, "GET");
      setUsers(data.users || []);
      setUsersPagination(data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadFeedback = useCallback(async (page = 1, status = "all", query = "") => {
    setLoadingFeedback(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        status,
        ...(query ? { search: query } : {})
      });

      const data = await adminApiRequest(`/admin/feedback?${params.toString()}`, "GET");
      setFeedbackItems(data.feedback || []);
      setFeedbackPagination(data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoadingFeedback(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadUsers(1, "");
    loadFeedback(1, "all", "");
  }, [loadFeedback, loadOverview, loadUsers]);

  const proPercent = useMemo(() => {
    const total = overview.stats.totalUsers || 0;
    if (!total) return "0.0";
    return ((overview.stats.proUsers / total) * 100).toFixed(1);
  }, [overview.stats.proUsers, overview.stats.totalUsers]);

  const monthlyBusinessData = overview?.charts?.monthlyBusiness || [];
  const feedbackStatusData = overview?.charts?.feedbackStatus || [];
  const planDistributionData = overview?.charts?.planDistribution || [];

  const chartAxisColor = isDark ? "#94a3b8" : "#64748b";
  const chartGridColor = isDark ? "#334155" : "#e2e8f0";
  const chartTooltipBg = isDark ? "#0f172a" : "#ffffff";
  const chartTooltipBorder = isDark ? "#334155" : "#e2e8f0";

  const refreshAll = async () => {
    setError("");
    await Promise.all([
      loadOverview(),
      loadUsers(usersPagination.page, usersSearchQuery),
      loadFeedback(feedbackPagination.page, feedbackStatus, feedbackSearchQuery)
    ]);
  };

  const handleUsersSearch = async (e) => {
    e.preventDefault();
    const value = usersSearchInput.trim();
    setUsersSearchQuery(value);
    await loadUsers(1, value);
  };

  const handleFeedbackSearch = async (e) => {
    e.preventDefault();
    const value = feedbackSearchInput.trim();
    setFeedbackSearchQuery(value);
    await loadFeedback(1, feedbackStatus, value);
  };

  const handleFeedbackStatusFilter = async (status) => {
    setFeedbackStatus(status);
    await loadFeedback(1, status, feedbackSearchQuery);
  };

  const handleTogglePlan = async (user) => {
    const nextPlan = user.plan === "pro" ? "free" : "pro";
    setActioningId(user._id);
    setError("");
    try {
      await adminApiRequest(`/admin/users/${user._id}/plan`, "PATCH", { plan: nextPlan });
      await Promise.all([
        loadOverview(),
        loadUsers(usersPagination.page, usersSearchQuery)
      ]);
    } catch (err) {
      setError(err.message || "Failed to update user plan");
    } finally {
      setActioningId("");
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Delete ${user.email}? This action cannot be undone.`);
    if (!confirmed) return;

    setActioningId(user._id);
    setError("");
    try {
      await adminApiRequest(`/admin/users/${user._id}`, "DELETE");
      const targetPage =
        users.length === 1 && usersPagination.page > 1
          ? usersPagination.page - 1
          : usersPagination.page;

      await Promise.all([
        loadOverview(),
        loadUsers(targetPage, usersSearchQuery)
      ]);
    } catch (err) {
      setError(err.message || "Failed to delete user");
    } finally {
      setActioningId("");
    }
  };

  const handleFeedbackStatusUpdate = async (feedbackId, status) => {
    setActioningId(feedbackId);
    setError("");
    try {
      await adminApiRequest(`/admin/feedback/${feedbackId}/status`, "PATCH", { status });
      await Promise.all([
        loadOverview(),
        loadFeedback(feedbackPagination.page, feedbackStatus, feedbackSearchQuery)
      ]);
    } catch (err) {
      setError(err.message || "Failed to update feedback");
    } finally {
      setActioningId("");
    }
  };

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${isDark ? "border-slate-700 bg-slate-900/90" : "border-slate-200 bg-white/90"}`}>
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-500 sm:tracking-[0.18em]">Admin Dashboard</p>
            <h1 className={`text-base font-black tracking-tight sm:text-xl ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Platform Control Center
            </h1>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] sm:flex-none sm:text-xs sm:tracking-[0.14em] ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? "Light" : "Dark"}
            </button>
            <button
              type="button"
              onClick={refreshAll}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] sm:flex-none sm:text-xs sm:tracking-[0.14em] ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-white hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 sm:flex-none sm:text-xs sm:tracking-[0.14em]"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error ? (
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${isDark ? "border-rose-400/30 bg-rose-500/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            <AlertTriangle size={16} />
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard isDark={isDark} title="Total Users" value={loadingOverview ? "..." : overview.stats.totalUsers} subtitle="All registered accounts" icon={Users} />
          <StatCard isDark={isDark} title="Pro Users" value={loadingOverview ? "..." : overview.stats.proUsers} subtitle={`${proPercent}% of users`} icon={Crown} accent="emerald" />
          <StatCard isDark={isDark} title="Total Queries" value={loadingOverview ? "..." : overview.stats.totalQueries} subtitle="All-time generated SQL" icon={UserRoundPlus} />
          <StatCard isDark={isDark} title="Revenue (INR)" value={loadingOverview ? "..." : overview.stats.totalRevenue} subtitle={`Invoices: ${overview.stats.totalInvoices || 0}`} icon={BadgeIndianRupee} accent="blue" />
          <StatCard isDark={isDark} title="Feedback" value={loadingOverview ? "..." : overview.stats.totalFeedback} subtitle={`Pending: ${overview.stats.pendingFeedback || 0}`} icon={MessageSquareText} accent="amber" />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className={`min-w-0 rounded-3xl border p-5 shadow-sm ${surfaceClass}`}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className={`text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.18em] ${mutedTextClass}`}>
                  Revenue Trend
                </h3>
                <p className={`mt-1 text-xs font-semibold ${mutedTextClass}`}>
                  Last 6 months (INR)
                </p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${mutedTextClass}`}>Total</p>
                <p className="text-lg font-black text-emerald-500">INR {overview.stats.totalRevenue || 0}</p>
              </div>
            </div>

            <div className="h-[220px] w-full sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyBusinessData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke={chartAxisColor} tick={{ fill: chartAxisColor, fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartAxisColor} tick={{ fill: chartAxisColor, fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTooltipBg,
                      borderColor: chartTooltipBorder,
                      borderRadius: 12,
                      color: chartAxisColor
                    }}
                    labelStyle={{ color: chartAxisColor, fontWeight: 800 }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className={`min-w-0 rounded-3xl border p-5 shadow-sm ${surfaceClass}`}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className={`text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.18em] ${mutedTextClass}`}>
                  Feedback Pipeline
                </h3>
                <p className={`mt-1 text-xs font-semibold ${mutedTextClass}`}>
                  New vs reviewed vs resolved
                </p>
              </div>
              <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.14em] ${isDark ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                Pending: {overview.stats.pendingFeedback || 0}
              </div>
            </div>

            <div className="h-[210px] w-full sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackStatusData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="status" stroke={chartAxisColor} tick={{ fill: chartAxisColor, fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={chartAxisColor} tick={{ fill: chartAxisColor, fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTooltipBg,
                      borderColor: chartTooltipBorder,
                      borderRadius: 12,
                      color: chartAxisColor
                    }}
                    labelStyle={{ color: chartAxisColor, fontWeight: 800 }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {(feedbackStatusData || []).map((entry) => {
                      const color =
                        entry.status === "Resolved"
                          ? "#10b981"
                          : entry.status === "Reviewed"
                          ? "#0ea5e9"
                          : "#f59e0b";
                      return <Cell key={`feedback-bar-${entry.status}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-700">
              <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.16em] ${mutedTextClass}`}>
                Plan Distribution
              </p>
              <div className="space-y-2">
                {planDistributionData.map((item) => {
                  const total = (overview.stats.totalUsers || 0) || 1;
                  const percent = ((item.value || 0) / total) * 100;
                  return (
                    <div key={item.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`text-xs font-black ${isDark ? "text-slate-200" : "text-slate-700"}`}>{item.name}</span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${mutedTextClass}`}>
                          {item.value} ({percent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className={`h-2 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                        <div
                          className={`h-2 rounded-full ${item.name === "Pro" ? "bg-emerald-500" : "bg-sky-500"}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={`min-w-0 rounded-3xl border p-5 shadow-sm ${surfaceClass}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className={`text-lg font-black tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                User Management
              </h2>
              <form onSubmit={handleUsersSearch} className="flex w-full max-w-md flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${inputClass}`}>
                  <Search size={15} className={isDark ? "text-slate-500" : "text-slate-400"} />
                  <input
                    value={usersSearchInput}
                    onChange={(e) => setUsersSearchInput(e.target.value)}
                    placeholder="Search by name or email"
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:w-auto"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="md:hidden space-y-3">
              {loadingUsers ? (
                <p className={`text-sm font-semibold ${mutedTextClass}`}>Loading users...</p>
              ) : users.length === 0 ? (
                <p className={`text-sm font-semibold ${mutedTextClass}`}>No users found.</p>
              ) : (
                users.map((user) => {
                  const isBusy = actioningId === user._id;
                  return (
                    <article key={user._id} className={`rounded-2xl border p-4 ${subtleBgClass}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-black break-words ${isDark ? "text-slate-100" : "text-slate-900"}`}>{user.name}</p>
                          <p className={`text-xs font-semibold break-all ${mutedTextClass}`}>{user.email}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${user.plan === "pro" ? "bg-emerald-100 text-emerald-700" : isDark ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"}`}>
                          {user.plan}
                        </span>
                      </div>
                      <p className={`mt-3 text-[11px] font-semibold ${mutedTextClass}`}>
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTogglePlan(user)}
                          className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] disabled:opacity-60 ${isDark ? "border-slate-600 text-slate-200" : "border-slate-200 text-slate-700"}`}
                        >
                          {user.plan === "pro" ? "Set Free" : "Set Pro"}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-rose-500 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead>
                  <tr className={`text-left text-[10px] font-black uppercase tracking-[0.16em] ${mutedTextClass}`}>
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Plan</th>
                    <th className="px-3 py-3">Joined</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingUsers ? (
                    <tr>
                      <td className={`px-3 py-6 text-sm font-semibold ${mutedTextClass}`} colSpan={4}>
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td className={`px-3 py-6 text-sm font-semibold ${mutedTextClass}`} colSpan={4}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isBusy = actioningId === user._id;
                      return (
                        <tr key={user._id}>
                          <td className="px-3 py-4">
                            <p className={`text-sm font-black ${isDark ? "text-slate-100" : "text-slate-900"}`}>{user.name}</p>
                            <p className={`text-xs font-semibold ${mutedTextClass}`}>{user.email}</p>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${user.plan === "pro" ? "bg-emerald-100 text-emerald-700" : isDark ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"}`}>
                              {user.plan}
                            </span>
                          </td>
                          <td className={`px-3 py-4 text-xs font-semibold ${mutedTextClass}`}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleTogglePlan(user)}
                                className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] disabled:opacity-60 ${isDark ? "border-slate-600 text-slate-200" : "border-slate-200 text-slate-700"}`}
                              >
                                {user.plan === "pro" ? "Set Free" : "Set Pro"}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteUser(user)}
                                className="rounded-lg border border-rose-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-rose-500 disabled:opacity-60"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pager
              currentPage={usersPagination.page}
              totalPages={usersPagination.pages}
              onPrev={() => loadUsers(usersPagination.page - 1, usersSearchQuery)}
              onNext={() => loadUsers(usersPagination.page + 1, usersSearchQuery)}
              isDark={isDark}
            />
          </section>

          <div className="min-w-0 space-y-6">
            <section className={`min-w-0 rounded-3xl border p-5 shadow-sm ${surfaceClass}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className={`text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.18em] ${mutedTextClass}`}>Feedback Triage</h3>
                <p className="text-xs font-black text-amber-500">Avg Rating: {overview.stats.avgFeedbackRating || 0}</p>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                {FEEDBACK_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleFeedbackStatusFilter(status)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] sm:tracking-[0.14em] ${
                      feedbackStatus === status
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                        : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-300"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <Filter size={11} />
                    {status}
                  </button>
                ))}
              </div>

              <form onSubmit={handleFeedbackSearch} className="mb-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${inputClass}`}>
                  <Search size={14} className={isDark ? "text-slate-500" : "text-slate-400"} />
                  <input
                    value={feedbackSearchInput}
                    onChange={(e) => setFeedbackSearchInput(e.target.value)}
                    placeholder="Search feedback"
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:w-auto"
                >
                  Find
                </button>
              </form>

              <div className="space-y-3 max-h-[380px] overflow-auto pr-1 custom-scrollbar">
                {loadingFeedback ? (
                  <p className={`text-sm font-semibold ${mutedTextClass}`}>Loading feedback...</p>
                ) : feedbackItems.length === 0 ? (
                  <p className={`text-sm font-semibold ${mutedTextClass}`}>No feedback found.</p>
                ) : (
                  feedbackItems.map((item) => {
                    const isBusy = actioningId === item._id;
                    return (
                      <article key={item._id} className={`rounded-2xl border p-4 ${subtleBgClass}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm font-black break-words ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                              {item.userId?.name || "User"} - {item.topic}
                            </p>
                            <p className={`text-[11px] font-semibold break-all ${mutedTextClass}`}>
                              {item.userId?.email || "Unknown email"}
                            </p>
                          </div>
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                            {item.rating}/5
                          </span>
                        </div>
                        <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                          {item.message}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                          <div className="flex items-center gap-2">
                            <select
                              value={item.status}
                              disabled={isBusy}
                              onChange={(e) => handleFeedbackStatusUpdate(item._id, e.target.value)}
                              className={`h-8 rounded-lg border px-2 text-[10px] font-black uppercase tracking-[0.12em] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
                            >
                              <option value="new">New</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <Pager
                currentPage={feedbackPagination.page}
                totalPages={feedbackPagination.pages}
                onPrev={() => loadFeedback(feedbackPagination.page - 1, feedbackStatus, feedbackSearchQuery)}
                onNext={() => loadFeedback(feedbackPagination.page + 1, feedbackStatus, feedbackSearchQuery)}
                isDark={isDark}
              />
            </section>

            <section className={`min-w-0 rounded-3xl border p-5 shadow-sm ${surfaceClass}`}>
              <h3 className={`text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.18em] ${mutedTextClass}`}>Recent Signups</h3>
              <div className="mt-4 space-y-3">
                {(overview.recentUsers || []).map((user) => (
                  <div key={user._id} className={`rounded-xl border p-3 ${subtleBgClass}`}>
                    <p className={`text-sm font-black break-words ${isDark ? "text-slate-100" : "text-slate-900"}`}>{user.name}</p>
                    <p className={`text-xs font-semibold break-all ${mutedTextClass}`}>{user.email}</p>
                  </div>
                ))}
                {!loadingOverview && (overview.recentUsers || []).length === 0 ? (
                  <p className={`text-xs font-semibold ${mutedTextClass}`}>No signup data.</p>
                ) : null}
              </div>
            </section>

            <section className={`min-w-0 rounded-3xl border p-5 shadow-sm ${surfaceClass}`}>
              <h3 className={`text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.18em] ${mutedTextClass}`}>Recent Invoices</h3>
              <div className="mt-4 space-y-3">
                {(overview.recentInvoices || []).map((invoice) => (
                  <div key={invoice._id} className={`rounded-xl border p-3 ${subtleBgClass}`}>
                    <p className={`text-sm font-black break-words ${isDark ? "text-slate-100" : "text-slate-900"}`}>{invoice.invoiceNumber}</p>
                    <p className={`text-xs font-semibold break-all ${mutedTextClass}`}>
                      {invoice.userId?.email || "Unknown user"}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-500">
                      INR {invoice.amount}
                    </p>
                  </div>
                ))}
                {!loadingOverview && (overview.recentInvoices || []).length === 0 ? (
                  <p className={`text-xs font-semibold ${mutedTextClass}`}>No invoice data.</p>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer className={`border-t px-4 py-4 sm:px-6 ${isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white/80"}`}>
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className={`text-[10px] font-black uppercase tracking-[0.1em] break-all sm:tracking-[0.16em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Logged in as {admin?.id || "admin"}
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.16em] text-emerald-500">
            <CheckCircle2 size={12} className="inline mr-1" />
            Admin session active
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, accent = "slate", isDark }) {
  const accentClassMap = {
    slate: isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700"
  };

  return (
    <article className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
      <div className="mb-4 flex items-center justify-between">
        <p className={`text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.16em] ${isDark ? "text-slate-300" : "text-slate-500"}`}>{title}</p>
        <span className={`rounded-xl p-2 ${accentClassMap[accent] || accentClassMap.slate}`}>
          {icon ? createElement(icon, { size: 16 }) : null}
        </span>
      </div>
      <p className={`text-2xl font-black tracking-tight sm:text-3xl ${isDark ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
      <p className={`mt-1 text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-500"}`}>{subtitle}</p>
    </article>
  );
}

function Pager({ currentPage, totalPages, onPrev, onNext, isDark }) {
  return (
    <div className="mt-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
      <p className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-500"}`}>
        Page {currentPage} of {totalPages}
      </p>
      <div className="inline-flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={onPrev}
          className={`w-full rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] disabled:opacity-40 sm:w-auto sm:tracking-[0.14em] ${isDark ? "border-slate-600 text-slate-200" : "border-slate-200 text-slate-700"}`}
        >
          Prev
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={onNext}
          className={`w-full rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] disabled:opacity-40 sm:w-auto sm:tracking-[0.14em] ${isDark ? "border-slate-600 text-slate-200" : "border-slate-200 text-slate-700"}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function statusBadgeClass(status) {
  if (status === "resolved") return "bg-emerald-100 text-emerald-700";
  if (status === "reviewed") return "bg-sky-100 text-sky-700";
  return "bg-amber-100 text-amber-700";
}
