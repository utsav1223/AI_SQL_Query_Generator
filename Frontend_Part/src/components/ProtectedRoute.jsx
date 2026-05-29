import { Navigate, useLocation } from "react-router-dom";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { Ban, Clock3, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function ProtectedRoute({ children, roles }) {
  const { user, accountRestriction, loading, loggingOut, logout } = useAuth();
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const location = useLocation();

  if (loggingOut) {
    return <RouteLoadingScreen label="Signing out..." />;
  }

  if (loading || !clerkLoaded) {
    return <RouteLoadingScreen label="Securing your workspace..." />;
  }

  if (!user) {
    if (accountRestriction) {
      return <AccountRestricted restriction={accountRestriction} onSignOut={logout} />;
    }

    if (isSignedIn) {
      return <AccountSyncIssue onSignOut={logout} />;
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (user.status === "suspended" || user.accountRestriction?.status === "suspended") {
    return (
      <AccountRestricted
        restriction={user.accountRestriction || {
          status: "suspended",
          title: "Account suspended",
          message: "Your account has been suspended."
        }}
        onSignOut={logout}
      />
    );
  }

  if (user.accessStatus && user.accessStatus !== "approved") {
    return <AccountRestricted restriction={user.accountRestriction || { status: user.accessStatus }} onSignOut={logout} />;
  }

  return children;
}

function AccountSyncIssue({ onSignOut }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)] px-4 py-10 text-[var(--text-main)]">
      <section className="dashboard-card w-full max-w-lg rounded-lg p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <ShieldCheck size={26} />
        </div>
        <h1 className="dashboard-heading mt-5 text-2xl font-bold tracking-tight">
          Finishing account setup
        </h1>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
          Your Clerk session is active, but the workspace profile did not load. Make sure the backend is running, then refresh the page.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="button-primary mt-5 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}

function AccountRestricted({ restriction = {}, onSignOut }) {
  const [appealMessage, setAppealMessage] = useState("");
  const [appealStatus, setAppealStatus] = useState({ type: "", message: "" });
  const [sendingAppeal, setSendingAppeal] = useState(false);
  const status = restriction.status || "blocked";
  const isPending = status === "pending";
  const isRejected = status === "rejected";
  const isDeleted = status === "deleted";
  const title =
    restriction.title ||
    (isPending
      ? "Access request received"
      : isRejected
      ? "Access rejected"
      : isDeleted
      ? "Account deleted"
      : "Account suspended");
  const message =
    restriction.message ||
    (isPending
      ? "Your account is signed in and waiting for workspace approval."
      : "This account cannot open the workspace.");
  const Icon = isPending ? Clock3 : isRejected ? ShieldCheck : Ban;

  const submitAppeal = async (event) => {
    event.preventDefault();
    const message = appealMessage.trim();

    if (message.length < 10) {
      setAppealStatus({
        type: "error",
        message: "Please include a short explanation for the admin team."
      });
      return;
    }

    setSendingAppeal(true);
    setAppealStatus({ type: "", message: "" });

    try {
      await authService.submitAccessAppeal({ message });
      setAppealMessage("");
      setAppealStatus({
        type: "success",
        message: "Your request has been sent to the admin team for review."
      });
    } catch (error) {
      setAppealStatus({
        type: "error",
        message: error.message || "Unable to send your request right now."
      });
    } finally {
      setSendingAppeal(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)] px-4 py-10 text-[var(--text-main)]">
      <section className="dashboard-card w-full max-w-lg rounded-lg p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon size={26} />
        </div>
        <h1 className="dashboard-heading mt-5 text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
          {message}
        </p>
        {restriction.reason ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left dark:border-rose-500/30 dark:bg-rose-500/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-600 dark:text-rose-300">
              Admin Message
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-rose-700 dark:text-rose-100">
              {restriction.reason}
            </p>
          </div>
        ) : null}

        <form onSubmit={submitAppeal} className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700 dark:bg-slate-900">
          <label htmlFor="access-appeal-message" className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Contact Admin
          </label>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            Send a professional request if you believe this action should be reviewed.
          </p>
          <textarea
            id="access-appeal-message"
            value={appealMessage}
            onChange={(event) => setAppealMessage(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Example: Please review my account access. I believe this restriction may have been applied by mistake."
            className="mt-3 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-900 outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-emerald-500/20"
          />
          {appealStatus.message ? (
            <p
              className={`mt-2 rounded-md border px-3 py-2 text-xs font-semibold ${
                appealStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              }`}
            >
              {appealStatus.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={sendingAppeal}
            className="button-primary mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendingAppeal ? "Sending Request" : "Send Review Request"}
          </button>
        </form>

        <button
          type="button"
          onClick={onSignOut}
          className="button-primary mt-5 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
