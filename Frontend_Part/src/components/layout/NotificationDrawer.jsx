import { CheckCheck, Loader2, Megaphone, X } from "lucide-react";

export default function NotificationDrawer({
  isOpen,
  notifications,
  unreadCount,
  error,
  loading,
  updatingId,
  onClose,
  onMarkRead,
  onMarkAllRead
}) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close notifications"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-[420px] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[var(--accent-soft-strong)] bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">
              <Megaphone size={13} />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Notifications</span>
            </div>
            <h2 className="dashboard-heading mt-3 text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
              Admin announcements
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="button-secondary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            aria-label="Close notifications"
            title="Close notifications"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3">
          <span className="inline-flex rounded-md bg-amber-100 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
            Unread: {unreadCount || 0}
          </span>

          <button
            type="button"
            disabled={!unreadCount || updatingId === "all"}
            onClick={onMarkAllRead}
            className="button-secondary inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingId === "all" ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
            Mark All Read
          </button>
        </div>

        {error ? (
          <p className="mx-5 mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-medium leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              No announcements yet.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification._id}
                  className={`rounded-lg border px-4 py-3 ${
                    notification.isRead
                      ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
                      : "border-teal-200 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${notificationToneClass(notification.priority)}`}>
                          {notification.priority || "normal"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                          <Megaphone size={11} />
                          {notification.type || "announcement"}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-bold leading-6 text-slate-950 dark:text-slate-100">
                        {notification.title}
                      </h3>
                    </div>
                    {!notification.isRead ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-600" /> : null}
                  </div>

                  <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600 dark:text-slate-300">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      {formatNotificationDate(notification.publishedAt || notification.createdAt)}
                    </p>
                    {!notification.isRead ? (
                      <button
                        type="button"
                        disabled={updatingId === notification._id}
                        onClick={() => onMarkRead(notification._id)}
                        className="button-primary inline-flex items-center justify-center rounded-md px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingId === notification._id ? "Saving" : "Mark Read"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function notificationToneClass(priority) {
  if (priority === "urgent") return "bg-rose-100 text-rose-700";
  if (priority === "important") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function formatNotificationDate(value) {
  return value ? new Date(value).toLocaleString() : "Published";
}
