import { useContext } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  Database,
  FileText,
  HelpCircle,
  History,
  LayoutGrid,
  LifeBuoy,
  MessageSquareQuote,
  Sparkles,
  Settings,
  X
} from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { getPlanLabel, isPaidPlan } from "../../utils/planAccess";
import WorkspaceSwitcher from "../clerk/WorkspaceSwitcher";
import UserAvatar from "../ui/UserAvatar";

const workspaceLinks = [
  { to: "/dashboard", icon: LayoutGrid, label: "Overview" },
  { to: "/dashboard/generate", icon: Sparkles, label: "AI Workspace" },
  { to: "/dashboard/schema", icon: Database, label: "Schema Context" },
  { to: "/dashboard/history", icon: History, label: "History" }
];

const accountLinks = [
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics", proOnly: true },
  { to: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { to: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" }
];

const helpLinks = [
  { to: "/dashboard/support", icon: LifeBuoy, label: "Support" },
  { to: "/dashboard/faq", icon: HelpCircle, label: "FAQ" },
  { to: "/dashboard/feedback", icon: MessageSquareQuote, label: "Feedback" }
];

export default function Sidebar({ onClose }) {
  const { user } = useAuth();
  const { isDark } = useContext(ThemeContext);
  const paidPlan = isPaidPlan(user?.plan);

  return (
    <div
      className={`flex h-dvh flex-col border-r px-3 py-4 ${
        isDark
          ? "border-slate-800 bg-slate-950 text-slate-100"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Database size={16} />
          </span>
          <div>
            <p className="dashboard-heading text-[13px] font-bold tracking-tight">
              AI SQL Studio
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Dashboard
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="button-secondary inline-flex h-9 w-9 items-center justify-center rounded-md lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="surface-card-soft mt-5 rounded-lg px-3 py-3 text-slate-950 dark:text-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Current plan
        </p>
        <p className="mt-2 text-sm font-bold">
          {getPlanLabel(user?.plan)}
        </p>
        <p className="mt-1.5 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
          {paidPlan
            ? "Advanced tools are available in your workspace."
            : "Upgrade to unlock analytics and advanced AI tools."}
        </p>
      </div>

      <div className="mt-3 lg:hidden">
        <WorkspaceSwitcher />
      </div>

      <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar pr-1">
        <NavSection title="Workspace">
          {workspaceLinks.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </NavSection>

        <NavSection title="Account">
          {accountLinks.map((item) =>
            item.proOnly && !paidPlan ? (
              <div
                key={item.to}
                className="surface-card-soft flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5 text-slate-500 dark:border-slate-700 dark:text-slate-400"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                    {item.label}
                  </span>
                </div>
                <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                  Paid
                </span>
              </div>
            ) : (
              <SidebarLink key={item.to} {...item} />
            )
          )}
        </NavSection>

        <NavSection title="Help">
          {helpLinks.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </NavSection>
      </div>

      <div className="surface-card mt-5 flex items-center gap-3 rounded-lg px-3 py-3 text-slate-950 dark:text-slate-100">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold">{user?.name || "Workspace User"}</p>
          <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {user?.email || "Signed in"}
          </p>
        </div>
      </div>
    </div>
  );
}

function NavSection({ title, children }) {
  return (
    <section className="mb-5">
      <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <nav className="space-y-1.5">{children}</nav>
    </section>
  );
}

function SidebarLink({ to, icon, label }) {
  const Icon = icon;

  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-md border px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
          isActive
            ? "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-200"
            : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        }`
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}
