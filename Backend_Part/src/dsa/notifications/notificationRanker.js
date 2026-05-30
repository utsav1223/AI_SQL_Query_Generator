const PRIORITY_WEIGHT = {
  urgent: 3,
  important: 2,
  normal: 1
};

const toTime = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
};

const getNotificationScore = (notification) => {
  const unreadWeight = notification.isRead ? 0 : 10000000000000;
  const priorityWeight = (PRIORITY_WEIGHT[notification.priority] || 1) * 1000000000;
  const timeWeight = toTime(notification.publishedAt || notification.createdAt);

  return unreadWeight + priorityWeight + timeWeight;
};

const rankNotifications = (notifications = []) => {
  return [...notifications].sort((a, b) => getNotificationScore(b) - getNotificationScore(a));
};

module.exports = {
  getNotificationScore,
  rankNotifications
};
