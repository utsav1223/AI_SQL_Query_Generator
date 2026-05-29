import { Navigate, useLocation } from "react-router-dom";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { Ban, Clock3, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function ProtectedRoute({ children, roles }) {
  const { user, accountRestriction, loading, logout } = useAuth();
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const location = useLocation();

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
