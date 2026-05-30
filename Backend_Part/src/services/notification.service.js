const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const NotificationRead = require("../models/NotificationRead");
const AppError = require("../utils/AppError");
const { createSecurityEvent } = require("../utils/securityMonitor");
const { rankNotifications } = require("../dsa/notifications/notificationRanker");
const { getOffsetPagination, buildPaginationMeta } = require("../dsa/pagination/cursorPagination");
const { buildRegexSearchFilter, normalizeSearchText } = require("../dsa/search/querySearch");

const NOTIFICATION_TYPES = ["announcement", "general", "maintenance", "billing", "security", "product"];
const NOTIFICATION_PRIORITIES = ["normal", "important", "urgent"];
const NOTIFICATION_AUDIENCES = ["all", "free", "paid"];
const NOTIFICATION_STATUSES = ["draft", "published", "archived"];
const PAID_PLANS = new Set(["pro", "team", "business"]);

const normalizeText = (value) => String(value || "").trim();

const normalizeEnum = (value, allowed, fallback) => {
  const normalized = normalizeText(value).toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
};

const isPaidPlan = (plan) => PAID_PLANS.has(String(plan || "").toLowerCase());

const getVisibleNotificationFilter = (actor) => {
  const now = new Date();
  const audienceFilters = [{ audience: "all" }];

  if (isPaidPlan(actor?.plan)) {
    audienceFilters.push({ audience: "paid" });
  } else {
    audienceFilters.push({ audience: "free" });
  }

  return {
    status: "published",
    $and: [
      {
        $or: [
          { publishedAt: null },
          { publishedAt: { $lte: now } }
        ]
      },
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      },
      { $or: audienceFilters }
    ]
  };
};

const serializeNotification = (notification, readMap = new Map()) => {
  const id = String(notification._id);
  const readAt = readMap.get(id) || null;

  return {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    audience: notification.audience,
    status: notification.status,
    createdBy: notification.createdBy,
    publishedAt: notification.publishedAt,
    expiresAt: notification.expiresAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
    readAt,
    isRead: Boolean(readAt)
  };
};

const getUserNotifications = async (actor, { limit = 8 } = {}) => {
  const safeLimit = Math.min(Math.max(parseInt(limit || "8", 10), 1), 20);
  const filter = getVisibleNotificationFilter(actor);
  const userObjectId = new mongoose.Types.ObjectId(actor.userId);

  const [notifications, visibleIds] = await Promise.all([
    Notification.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(safeLimit)
      .lean(),
    Notification.find(filter).select("_id").lean()
  ]);

  const allVisibleIds = visibleIds.map((notification) => notification._id);
  const listedIds = notifications.map((notification) => notification._id);
  const [listedReads, readCount] = await Promise.all([
    listedIds.length
      ? NotificationRead.find({
          userId: userObjectId,
          notificationId: { $in: listedIds }
        }).lean()
      : [],
    allVisibleIds.length
      ? NotificationRead.countDocuments({
          userId: userObjectId,
          notificationId: { $in: allVisibleIds }
        })
      : 0
  ]);

  const readMap = new Map(
    listedReads.map((receipt) => [String(receipt.notificationId), receipt.readAt])
  );

  const serializedNotifications = notifications.map((notification) => serializeNotification(notification, readMap));

  return {
    notifications: rankNotifications(serializedNotifications),
    unreadCount: Math.max(allVisibleIds.length - readCount, 0)
  };
};

const markNotificationRead = async (actor, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new AppError(400, "notificationId must be a valid MongoDB id");
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    ...getVisibleNotificationFilter(actor)
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  await NotificationRead.findOneAndUpdate(
    {
      notificationId: notification._id,
      userId: actor.userId
    },
    {
      $set: {
        readAt: new Date()
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  return {
    notificationId: notification._id,
    readAt: new Date()
  };
};

const markAllNotificationsRead = async (actor) => {
  const notifications = await Notification.find(getVisibleNotificationFilter(actor)).select("_id").lean();
  const now = new Date();

  if (notifications.length === 0) {
    return {
      updated: 0
    };
  }

  const result = await NotificationRead.bulkWrite(
    notifications.map((notification) => ({
      updateOne: {
        filter: {
          notificationId: notification._id,
          userId: actor.userId
        },
        update: {
          $set: {
            readAt: now
          }
        },
        upsert: true
      }
    })),
    { ordered: false }
  );

  return {
    updated: (result.upsertedCount || 0) + (result.modifiedCount || 0)
  };
};

const createNotification = async ({ adminId, payload, requestMeta = {} }) => {
  const title = normalizeText(payload?.title);
  const message = normalizeText(payload?.message);
  const status = normalizeEnum(payload?.status, NOTIFICATION_STATUSES, "published");
  const publishedAt = payload?.publishedAt ? new Date(payload.publishedAt) : new Date();
  const expiresAt = payload?.expiresAt ? new Date(payload.expiresAt) : null;

  if (!title || !message) {
    throw new AppError(400, "Notification title and message are required");
  }

  if (Number.isNaN(publishedAt.getTime())) {
    throw new AppError(400, "publishedAt must be a valid date");
  }

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new AppError(400, "expiresAt must be a valid date");
  }

  const notification = await Notification.create({
    title,
    message,
    type: normalizeEnum(payload?.type, NOTIFICATION_TYPES, "announcement"),
    priority: normalizeEnum(payload?.priority, NOTIFICATION_PRIORITIES, "normal"),
    audience: normalizeEnum(payload?.audience, NOTIFICATION_AUDIENCES, "all"),
    status,
    createdBy: adminId || "admin",
    publishedAt: status === "published" ? publishedAt : null,
    expiresAt
  });

  await createSecurityEvent({
    type: "admin_notification_created",
    severity: notification.priority === "urgent" ? "medium" : "low",
    source: "admin",
    message: "Admin published a dashboard notification.",
    metadata: {
      notificationId: String(notification._id),
      audience: notification.audience,
      notificationType: notification.type,
      priority: notification.priority,
      status: notification.status,
      adminId: adminId || "admin"
    },
    ...requestMeta
  });

  return notification;
};

const getAdminNotifications = async ({ page, limit, status, audience, search }) => {
  const { page: safePage, limit: safeLimit, skip } = getOffsetPagination({ page, limit, maxLimit: 50 });
  const statusFilter = normalizeText(status).toLowerCase();
  const audienceFilter = normalizeText(audience).toLowerCase();
  const searchText = normalizeSearchText(search);
  const filter = {};

  if (NOTIFICATION_STATUSES.includes(statusFilter)) {
    filter.status = statusFilter;
  }

  if (NOTIFICATION_AUDIENCES.includes(audienceFilter)) {
    filter.audience = audienceFilter;
  }

  if (searchText) {
    Object.assign(filter, buildRegexSearchFilter(searchText, ["title", "message"]));
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Notification.countDocuments(filter)
  ]);

  return {
    notifications,
    pagination: buildPaginationMeta({ total, page: safePage, limit: safeLimit })
  };
};

const updateNotificationStatus = async ({ notificationId, status, adminId }) => {
  const nextStatus = normalizeEnum(status, NOTIFICATION_STATUSES, "");

  if (!nextStatus) {
    throw new AppError(400, "Invalid notification status");
  }

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  notification.status = nextStatus;
  notification.createdBy = notification.createdBy || adminId || "admin";
  if (nextStatus === "published" && !notification.publishedAt) {
    notification.publishedAt = new Date();
  }
  await notification.save();

  return notification;
};

module.exports = {
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  createNotification,
  getAdminNotifications,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationStatus
};
