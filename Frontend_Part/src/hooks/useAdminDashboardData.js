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
    recentHighSeverityEvents: 0
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
  riskyUsers: [],
  recentAdminActions: []
};

export const FEEDBACK_STATUSES = ["all", "new", "reviewed", "resolved"];

export function useAdminDashboardData() {
  const { confirmAction, ConfirmationDialog } = useConfirmationDialog();
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
  const [securityEvents, setSecurityEvents] = useState([]);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
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

  const loadUsers = useCallback(async (page = 1, query = "") => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
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

      const data = await adminService.getFeedback(params.toString());
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

  const refreshAll = async () => {
    setError("");
    await Promise.all([
      loadOverview(),
      loadUsers(usersPagination.page, usersSearchQuery),
      loadFeedback(feedbackPagination.page, feedbackStatus, feedbackSearchQuery)
    ]);
  };

  const handleUsersSearch = async (event) => {
    event.preventDefault();
    const value = usersSearchInput.trim();
    setUsersSearchQuery(value);
    await loadUsers(1, value);
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

  return {
    actioningId,
    ConfirmationDialog,
    error,
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
    handleSecurityEventStatusUpdate,
    handleSuspendToggle,
    handleTogglePlan,
    handleUsersSearch,
    loadFeedback,
    loadUsers,
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
    users,
    usersPagination,
    usersSearchInput,
    usersSearchQuery
  };
}
