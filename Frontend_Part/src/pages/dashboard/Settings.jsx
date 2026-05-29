import { useMemo, useState } from "react";
import {
  APIKeys,
  OrganizationProfile,
  useOrganization,
  UserProfile
} from "@clerk/clerk-react";
import { Building2, Code2, ShieldCheck, UserRound } from "lucide-react";
import ClerkFeatureBoundary from "../../components/clerk/ClerkFeatureBoundary";
import WorkspaceSwitcher from "../../components/clerk/WorkspaceSwitcher";
import { clerkDashboardAppearance } from "../../config/clerkAppearance";
import { useAuth } from "../../hooks/useAuth";
import { getPlanLabel, hasPlan } from "../../utils/planAccess";

const tabs = [
  {
    id: "account",
    label: "Account",
    icon: UserRound
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: Building2
  },
  {
    id: "developer",
    label: "Developer",
    icon: Code2
  }
];

export default function Settings() {
  const { user } = useAuth();
  const { organization, isLoaded } = useOrganization();
  const [activeTab, setActiveTab] = useState("account");
  const teamWorkspaceEnabled =
    hasPlan(user?.plan, "team") ||
    hasPlan(user?.personalPlan, "team") ||
    hasPlan(user?.billing?.plan, "team");

  const activeMeta = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) || tabs[0],
    [activeTab]
  );
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="dashboard-page space-y-6">
      <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-800 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-200">
              <ShieldCheck size={13} />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                Account center
              </span>
            </div>
            <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              Profile, security, workspace, and API access
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              Manage your account and team controls from one organized settings area.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <SummaryTile label="Plan" value={getPlanLabel(user?.plan)} />
            <SummaryTile
              label="Workspace"
              value={isLoaded && organization?.name ? organization.name : "Personal"}
            />
          </div>
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-4 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                active
                  ? "bg-slate-950 text-white dark:bg-teal-500 dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section className="dashboard-card rounded-lg p-4 sm:p-5">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
            <ActiveIcon size={17} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Settings
            </p>
            <h2 className="dashboard-heading text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
              {activeMeta.label}
            </h2>
          </div>
        </div>

        {activeTab === "account" ? <AccountSettings /> : null}
        {activeTab === "workspace" ? (
          <WorkspaceSettings
            organization={organization}
            teamWorkspaceEnabled={teamWorkspaceEnabled}
          />
        ) : null}
        {activeTab === "developer" ? <DeveloperSettings /> : null}
      </section>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function AccountSettings() {
  return (
    <div className="clerk-profile-section min-w-0">
      <ClerkFeatureBoundary>
        <UserProfile routing="hash" appearance={clerkDashboardAppearance} />
      </ClerkFeatureBoundary>
    </div>
  );
}

function WorkspaceSettings({ organization, teamWorkspaceEnabled }) {
  if (!teamWorkspaceEnabled) {
    return <WorkspaceSwitcher />;
  }

  return (
    <div className="space-y-5">
      <WorkspaceSwitcher />

      {organization ? (
        <div className="clerk-profile-section min-w-0">
          <ClerkFeatureBoundary>
            <OrganizationProfile routing="hash" appearance={clerkDashboardAppearance} />
          </ClerkFeatureBoundary>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-950">
          <Building2 className="mx-auto text-[var(--accent)]" size={28} />
          <h3 className="dashboard-heading mt-4 text-xl font-bold tracking-tight">
            Personal workspace
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
            Create or select an organization to manage members, roles, and team settings here.
          </p>
        </div>
      )}
    </div>
  );
}

function DeveloperSettings() {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
        <p className="text-sm font-semibold leading-7 text-slate-700 dark:text-slate-300">
          Create and revoke API keys for developer access from this section.
        </p>
      </div>

      <div className="clerk-profile-section min-w-0">
        <ClerkFeatureBoundary>
          <APIKeys appearance={clerkDashboardAppearance} />
        </ClerkFeatureBoundary>
      </div>
    </div>
  );
}
