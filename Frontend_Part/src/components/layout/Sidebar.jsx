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

const workspaceLinks = [
  { to: "/dashboard", icon: LayoutGrid, label: "Overview" },
  { to: "/dashboard/generate", icon: Sparkles, label: "AI Workspace" },
  { to: "/dashboard/schema", icon: Database, label: "Schema Context" },
  { to: "/dashboard/history", icon: History, label: "History" }
];

const accountLinks = [
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics", proOnly: true },
  { to: "/dashboard/pricing", icon: CreditCard, label: "Billing" },
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

  return (
    <div
      className={`flex h-dvh flex-col border-r px-4 py-4 ${
        isDark
          ? "border-slate-800 bg-slate-950 text-slate-100"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Database size={18} />
          </span>
          <div>
            <p className="dashboard-heading text-sm font-extrabold tracking-tight">
              AI SQL Studio
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Dashboard
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="button-secondary inline-flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="surface-card-soft mt-6 rounded-2xl px-4 py-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Current plan
        </p>
        <p className="mt-2 text-base font-bold">
          {user?.plan === "pro" ? "Professional" : "Free"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {user?.plan === "pro"
            ? "Advanced tools are available in your workspace."
            : "Upgrade to unlock analytics and advanced AI tools."}
        </p>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
        <NavSection title="Workspace">
          {workspaceLinks.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </NavSection>

        <NavSection title="Account">
          {accountLinks.map((item) =>
            item.proOnly && user?.plan !== "pro" ? (
              <div
                key={item.to}
                className="surface-card-soft flex items-center justify-between rounded-xl px-4 py-3 text-slate-400"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">
                    {item.label}
                  </span>
                </div>
                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
                  Pro
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

      <div className="surface-card mt-6 rounded-2xl px-4 py-4">
        <p className="truncate text-sm font-bold">{user?.name || "Workspace User"}</p>
        <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {user?.email || "Signed in"}
        </p>
      </div>
    </div>
  );
}

function NavSection({ title, children }) {
  return (
    <section className="mb-6">
      <p className="mb-3 px-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <nav className="space-y-2">{children}</nav>
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
        `group flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] transition-colors ${
          isActive
            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        }`
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}
