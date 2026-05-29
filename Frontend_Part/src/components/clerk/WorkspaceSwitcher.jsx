import { useState } from "react";
import { OrganizationSwitcher, useClerk, useOrganization } from "@clerk/clerk-react";
import { Building2, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  clerkDashboardAppearance,
  clerkSwitcherAppearance
} from "../../config/clerkAppearance";
import { useAuth } from "../../hooks/useAuth";
import { hasPlan } from "../../utils/planAccess";
import ClerkFeatureBoundary from "./ClerkFeatureBoundary";

export default function WorkspaceSwitcher({ compact = false }) {
  const { user } = useAuth();
  const { organization, isLoaded } = useOrganization();
  const clerk = useClerk();
  const location = useLocation();
  const navigate = useNavigate();
  const workspaceLabel = organization?.name || "Personal workspace";
  const returnToCurrentWorkspacePage = `${location.pathname}${location.search || ""}`;
  const canUseTeamWorkspace =
    hasPlan(user?.plan, "team") ||
    hasPlan(user?.personalPlan, "team") ||
    hasPlan(user?.billing?.plan, "team");

  if (!canUseTeamWorkspace) {
    return compact ? null : (
      <LockedWorkspace
        hasActiveOrganization={Boolean(organization)}
        setActive={clerk.setActive}
        onUpgrade={() => navigate("/dashboard/billing")}
      />
    );
  }

  return (
    <ClerkFeatureBoundary fallback={compact ? null : <SwitcherFallback />}>
      <div className={compact ? "min-w-0" : "surface-card-soft rounded-lg p-3"}>
        {!compact ? (
          <div className="mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Building2 size={15} className="text-[var(--accent)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
              {isLoaded ? workspaceLabel : "Workspace"}
            </p>
          </div>
        ) : null}

        <OrganizationSwitcher
          appearance={clerkSwitcherAppearance}
          afterCreateOrganizationUrl={returnToCurrentWorkspacePage}
          afterSelectOrganizationUrl={returnToCurrentWorkspacePage}
          afterSelectPersonalUrl={returnToCurrentWorkspacePage}
          afterLeaveOrganizationUrl={returnToCurrentWorkspacePage}
          organizationProfileProps={{ appearance: clerkDashboardAppearance }}
          skipInvitationScreen={false}
        />
      </div>
    </ClerkFeatureBoundary>
  );
}

function LockedWorkspace({ hasActiveOrganization, setActive, onUpgrade }) {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  const usePersonalWorkspace = async () => {
    if (!setActive || switching) {
      return;
    }

    try {
      setSwitching(true);
      setError("");
      await setActive({ organization: null });
    } catch (err) {
      setError(err.message || "Unable to switch workspace");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="surface-card-soft rounded-lg p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
          <LockKeyhole size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
            Team workspace
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
            Team workspaces and organization creation unlock after the Team plan is active.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onUpgrade}
          className="button-primary inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]"
        >
          <Building2 size={14} />
          Upgrade Team
        </button>

        {hasActiveOrganization ? (
          <button
            type="button"
            onClick={usePersonalWorkspace}
            disabled={switching}
            className="button-secondary inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {switching ? <Loader2 size={14} className="animate-spin" /> : <UserRound size={14} />}
            Personal
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SwitcherFallback() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      Team workspaces are not enabled yet.
    </div>
  );
}
