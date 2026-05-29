import { useContext, useState } from "react";
import { useLocation } from "react-router-dom";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { getPlanLabel } from "../../utils/planAccess";
import WorkspaceSwitcher from "../clerk/WorkspaceSwitcher";
import UserAvatar from "../ui/UserAvatar";

const routeLabelMap = {
  dashboard: {
    title: "Overview",
    description: "Track usage and recent activity"
  },
  generate: {
    title: "AI Workspace",
    description: "Generate, validate, and refine SQL"
  },
  schema: {
    title: "Schema Context",
    description: "Save the structure used by the AI"
  },
  history: {
    title: "History",
    description: "Review previous requests and outputs"
  },
  analytics: {
    title: "Analytics",
    description: "See advanced usage insights"
  },
  billing: {
    title: "Billing",
    description: "Compare plans and upgrade"
  },
  pricing: {
    title: "Billing",
    description: "Compare plans and upgrade"
  },
  invoices: {
    title: "Invoices",
    description: "Review payment records"
  },
  settings: {
    title: "Settings",
    description: "Manage profile and account security"
  },
  support: {
    title: "Support",
    description: "Get help when you need it"
  },
  faq: {
    title: "FAQ",
    description: "Common product questions"
  },
  feedback: {
    title: "Feedback",
    description: "Share suggestions with the team"
  }
};

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const pathName = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
  const pageMeta =
    routeLabelMap[pathName] || {
      title: pathName.charAt(0).toUpperCase() + pathName.slice(1),
      description: "Workspace page"
    };

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-[var(--border)] bg-[var(--app-bg)]/90 backdrop-blur-xl lg:left-[260px]">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="button-secondary inline-flex h-9 w-9 items-center justify-center rounded-md lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              Workspace
            </p>
            <h1 className="dashboard-heading truncate text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
              {pageMeta.title}
            </h1>
            <p className="hidden text-[13px] text-slate-500 dark:text-slate-400 md:block">
              {pageMeta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden max-w-[260px] lg:block">
            <WorkspaceSwitcher compact />
          </div>

          <div className="surface-card hidden items-center gap-3 rounded-lg px-3 py-2 text-slate-950 dark:text-slate-100 sm:flex">
            <UserAvatar user={user} size="sm" />
            <div className="leading-tight">
              <p className="text-[13px] font-bold">{user?.name || "Workspace User"}</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {getPlanLabel(user?.plan)} plan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="button-secondary inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em]"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
          </button>

          <button
            type="button"
            disabled={loggingOut}
            onClick={async () => {
              if (loggingOut) {
                return;
              }

              setLoggingOut(true);
              await logout();
            }}
            className="button-primary inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">{loggingOut ? "Logging out" : "Logout"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
