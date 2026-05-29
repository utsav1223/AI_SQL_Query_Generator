import { Navigate, useLocation } from "react-router-dom";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { Clock3, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading, logout } = useAuth();
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const location = useLocation();

  if (loading || !clerkLoaded) {
    return <RouteLoadingScreen label="Securing your workspace..." />;
  }

  if (!user) {
    if (isSignedIn) {
      return <AccountSyncIssue onSignOut={logout} />;
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (user.accessStatus && user.accessStatus !== "approved") {
    return <PendingAccess status={user.accessStatus} />;
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

function PendingAccess({ status }) {
  const isRejected = status === "rejected";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)] px-4 py-10 text-[var(--text-main)]">
      <section className="dashboard-card w-full max-w-lg rounded-lg p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          {isRejected ? <ShieldCheck size={26} /> : <Clock3 size={26} />}
        </div>
        <h1 className="dashboard-heading mt-5 text-2xl font-bold tracking-tight">
          {isRejected ? "Access is not available" : "Access request received"}
        </h1>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
          {isRejected
            ? "This account cannot open the workspace. Contact the project owner if this looks wrong."
            : "Your account is signed in and waiting for workspace approval."}
        </p>
      </section>
    </main>
  );
}
