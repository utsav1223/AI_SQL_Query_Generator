import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirmationDialog } from "./useConfirmationDialog";
import { adminService } from "../services/adminService";

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
    pendingFeedback: 0,
    pendingSecurityEvents: 0,
    recentHighSeverityEvents: 0,
    pendingAccessAppeals: 0
  },
  charts: {
    monthlyBusiness: [],
    feedbackStatus: [],
    planDistribution: []
  },
  recentUsers: [],
  recentInvoices: [],
  recentFeedback: [],
  recentSecurityEvents: [],
  recentAccessAppeals: [],
  riskyUsers: [],
  recentAdminActions: []
};

export const FEEDBACK_STATUSES = ["all", "new", "reviewed", "resolved"];
export const ACCESS_APPEAL_STATUSES = ["new", "in_review", "resolved", "closed", "all"];

const escapeCsvValue = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadTextFile = (content, filename, type = "text/csv;charset=utf-8") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export function useAdminDashboardData() {
  const { confirmAction, ConfirmationDialog } = useConfirmationDialog();
  const [overview, setOverview] = useState(initialOverview);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [usersSearchInput, setUsersSearchInput] = useState("");
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userAccessFilter, setUserAccessFilter] = useState("all");

  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackPagination, setFeedbackPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [feedbackStatus, setFeedbackStatus] = useState("all");
  const [feedbackSearchInput, setFeedbackSearchInput] = useState("");
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState("");
  const [securityEvents, setSecurityEvents] = useState([]);
  const [accessAppeals, setAccessAppeals] = useState([]);
  const [accessAppealsPagination, setAccessAppealsPagination] = useState({ total: 0, page: 1, limit: 5, pages: 1 });
  const [accessAppealStatus, setAccessAppealStatus] = useState("new");

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [loadingAccessAppeals, setLoadingAccessAppeals] = useState(true);
  const [actioningId, setActioningId] = useState("");
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await adminService.getOverview();
      setOverview(data);
      setSecurityEvents(data.recentSecurityEvents || []);
    } catch (err) {
      setError(err.message || "Failed to load overview");
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadUsers = useCallback(async (page = 1, query = "", filters = {}) => {
    setLoadingUsers(true);
    try {
      const resolvedFilters = {
        plan: filters.plan ?? userPlanFilter,
        status: filters.status ?? userStatusFilter,
        accessStatus: filters.accessStatus ?? userAccessFilter
      };
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        plan: resolvedFilters.plan,
        status: resolvedFilters.status,
        accessStatus: resolvedFilters.accessStatus,
        ...(query ? { search: query } : {})
      });

      const data = await adminService.getUsers(params.toString());
      setUsers(data.users || []);
      setUsersPagination(data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [userAccessFilter, userPlanFilter, userStatusFilter]);

  const loadFeedback = useCallback(async (page = 1, status = "all", query = "") => {
    setLoadingFeedback(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        status,
        ...(query ? { search: query } : {})
      });

      const data = await adminService.getFeedback(params.toString());
      setFeedbackItems(data.feedback || []);
      setFeedbackPagination(data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoadingFeedback(false);
    }
  }, []);

  const loadAccessAppeals = useCallback(async (page = 1, status = "new") => {
    setLoadingAccessAppeals(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "5",
        status
      });

      const data = await adminService.getAccessAppeals(params.toString());
      setAccessAppeals(data.appeals || []);
      setAccessAppealsPagination(data.pagination || { total: 0, page: 1, limit: 5, pages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load access requests");
    } finally {
      setLoadingAccessAppeals(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadFeedback(1, "all", "");
    loadAccessAppeals(1, "new");
  }, [loadAccessAppeals, loadFeedback, loadOverview]);

  useEffect(() => {
    loadUsers(1, usersSearchQuery);
  }, [loadUsers, usersSearchQuery]);

  const proPercent = useMemo(() => {
    const total = overview.stats.totalUsers || 0;
    if (!total) return "0.0";
    return ((overview.stats.proUsers / total) * 100).toFixed(1);
  }, [overview.stats.proUsers, overview.stats.totalUsers]);

  const refreshAll = async () => {
    setError("");
    await Promise.all([
      loadOverview(),
      loadUsers(usersPagination.page, usersSearchQuery),
      loadFeedback(feedbackPagination.page, feedbackStatus, feedbackSearchQuery),
      loadAccessAppeals(accessAppealsPagination.page, accessAppealStatus)
    ]);
  };

  const handleUsersSearch = async (event) => {
    event.preventDefault();
    const value = usersSearchInput.trim();
    setUsersSearchQuery(value);
  };

  const handleUsersFilterChange = (filterName, value) => {
    if (filterName === "plan") {
      setUserPlanFilter(value);
    } else if (filterName === "status") {
      setUserStatusFilter(value);
    } else if (filterName === "accessStatus") {
      setUserAccessFilter(value);
    }
  };

  const resetUsersFilters = () => {
    setUserPlanFilter("all");
    setUserStatusFilter("all");
    setUserAccessFilter("all");
    setUsersSearchInput("");
    setUsersSearchQuery("");
  };

  const exportVisibleUsers = () => {
    const rows = users.map((user) => [
      user.name,
      user.email,
      user.plan,
      user.status || "active",
      user.accessStatus || "approved",
      user.riskScore || 0,
      user.createdAt ? new Date(user.createdAt).toISOString() : ""
    ]);
    const csv = [
      ["Name", "Email", "Plan", "Status", "Access", "Risk Score", "Joined"],
      ...rows
    ]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    downloadTextFile(csv, `admin-users-page-${usersPagination.page}.csv`);
  };

  const handleFeedbackSearch = async (event) => {
    event.preventDefault();
    const value = feedbackSearchInput.trim();
    setFeedbackSearchQuery(value);
    await loadFeedback(1, feedbackStatus, value);
  };

  const handleFeedbackStatusFilter = async (status) => {
    setFeedbackStatus(status);
    await loadFeedback(1, status, feedbackSearchQuery);
  };

  const handleAccessAppealStatusFilter = async (status) => {
    setAccessAppealStatus(status);
    await loadAccessAppeals(1, status);
  };

  const getModerationReason = async ({ title, description, confirmLabel = "Submit" }) => {
    const result = await confirmAction({
      title,
      description,
      confirmLabel,
      tone: "warning",
      requireReason: true,
      reasonLabel: "Moderation reason",
      reasonPlaceholder: "Explain why this admin action is needed"
    });

    if (!result?.confirmed) return null;
    if (!result.reason) {
      setError("Moderation reason is required.");
      return null;
    }

    return result.reason;
  };

  const handleTogglePlan = async (user) => {
    const nextPlan = user.plan === "pro" ? "free" : "pro";
    const reason = await getModerationReason({
      title: nextPlan === "pro" ? "Upgrade user to Pro" : "Move user to Free",
      description: `${user.email} will be changed to the ${nextPlan} plan.`,
      confirmLabel: nextPlan === "pro" ? "Set Pro" : "Set Free"
    });
    if (!reason) return;

    setActioningId(user._id);
    setError("");
    try {
      await adminService.moderateUser(user._id, {
        action: nextPlan === "pro" ? "set_pro" : "set_free",
        reason
      });
      await Promise.all([loadOverview(), loadUsers(usersPagination.page, usersSearchQuery)]);
    } catch (err) {
      setError(err.message || "Failed to update user plan");
    } finally {
      setActioningId("");
    }
  };

  const handleDeleteUser = async (user) => {
    const reason = await getModerationReason({
      title: "Delete user account",
      description: `${user.email} and related user data will be permanently removed.`,
      confirmLabel: "Delete User"
    });
    if (!reason) return;

    const confirmed = await confirmAction({
      title: "Confirm permanent delete",
      description: `This cannot be undone. Type DELETE to remove ${user.email}.`,
      confirmLabel: "Delete",
      tone: "danger",
      confirmText: "DELETE"
    });
    if (!confirmed?.confirmed) return;

    setActioningId(user._id);
    setError("");
    try {
      await adminService.moderateUser(user._id, {
        action: "delete",
        reason
      });
      const targetPage = users.length === 1 && usersPagination.page > 1 ? usersPagination.page - 1 : usersPagination.page;
      await Promise.all([loadOverview(), loadUsers(targetPage, usersSearchQuery)]);
    } catch (err) {
      setError(err.message || "Failed to delete user");
    } finally {
      setActioningId("");
    }
  };

  const handleSuspendToggle = async (user) => {
    const action = user.status === "suspended" ? "unsuspend" : "suspend";
    const label = action === "suspend" ? "suspend" : "unsuspend";
    const reason = await getModerationReason({
      title: `${label.charAt(0).toUpperCase()}${label.slice(1)} user`,
      description: `${user.email} will be ${label}ed.`,
      confirmLabel: label
    });
    if (!reason) return;

    setActioningId(user._id);
    setError("");
    try {
      await adminService.moderateUser(user._id, {
        action,
        reason
      });
      await Promise.all([loadOverview(), loadUsers(usersPagination.page, usersSearchQuery)]);
    } catch (err) {
      setError(err.message || "Failed to update user status");
    } finally {
      setActioningId("");
    }
  };

  const handleAccessDecision = async (user, nextAccessStatus) => {
    const action = nextAccessStatus === "approved" ? "approve_access" : "reject_access";
    const reason = await getModerationReason({
      title: nextAccessStatus === "approved" ? "Approve access" : "Reject access",
      description: `${user.email} will be marked as ${nextAccessStatus}.`,
      confirmLabel: nextAccessStatus === "approved" ? "Approve" : "Reject"
    });
    if (!reason) return;

    setActioningId(user._id);
    setError("");
    try {
      await adminService.moderateUser(user._id, {
        action,
        reason
      });
      await Promise.all([loadOverview(), loadUsers(usersPagination.page, usersSearchQuery)]);
    } catch (err) {
      setError(err.message || "Failed to update access status");
    } finally {
      setActioningId("");
    }
  };


  const handleFeedbackStatusUpdate = async (feedbackId, status) => {
    setActioningId(feedbackId);
    setError("");
    try {
      await adminService.updateFeedbackStatus(feedbackId, { status });
      await Promise.all([loadOverview(), loadFeedback(feedbackPagination.page, feedbackStatus, feedbackSearchQuery)]);
    } catch (err) {
      setError(err.message || "Failed to update feedback");
    } finally {
      setActioningId("");
    }
  };

  const handleSecurityEventStatusUpdate = async (eventId, status) => {
    setActioningId(eventId);
    setError("");
    try {
      await adminService.updateSecurityEventStatus(eventId, { status });
      setSecurityEvents((prev) => prev.map((event) => (event._id === eventId ? { ...event, status } : event)));
      await loadOverview();
    } catch (err) {
      setError(err.message || "Failed to update security event status");
    } finally {
      setActioningId("");
    }
  };

  const handleAccessAppealStatusUpdate = async (appealId, status) => {
    setActioningId(appealId);
    setError("");
    try {
      await adminService.updateAccessAppealStatus(appealId, { status });
      await Promise.all([
        loadOverview(),
        loadAccessAppeals(accessAppealsPagination.page, accessAppealStatus)
      ]);
    } catch (err) {
      setError(err.message || "Failed to update access request");
    } finally {
      setActioningId("");
    }
  };

  return {
    accessAppeals,
    accessAppealsPagination,
    accessAppealStatus,
    actioningId,
    ConfirmationDialog,
    error,
    exportVisibleUsers,
    feedbackItems,
    feedbackPagination,
    feedbackSearchInput,
    feedbackSearchQuery,
    feedbackStatus,
    feedbackStatusData: overview?.charts?.feedbackStatus || [],
    handleDeleteUser,
    handleFeedbackSearch,
    handleFeedbackStatusFilter,
    handleFeedbackStatusUpdate,
    handleAccessAppealStatusFilter,
    handleAccessAppealStatusUpdate,
    handleSecurityEventStatusUpdate,
    handleAccessDecision,
    handleSuspendToggle,
    handleTogglePlan,
    handleUsersSearch,
    handleUsersFilterChange,
    loadFeedback,
    loadAccessAppeals,
    loadUsers,
    loadingAccessAppeals,
    loadingFeedback,
    loadingOverview,
    loadingUsers,
    monthlyBusinessData: overview?.charts?.monthlyBusiness || [],
    overview,
    planDistributionData: overview?.charts?.planDistribution || [],
    proPercent,
    refreshAll,
    securityEvents,
    setFeedbackSearchInput,
    setUsersSearchInput,
    resetUsersFilters,
    userAccessFilter,
    userPlanFilter,
    userStatusFilter,
    users,
    usersPagination,
    usersSearchInput,
    usersSearchQuery
  };
}
