import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

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
  const navigate = useNavigate();
  const location = useLocation();

  const pathName = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
  const pageMeta =
    routeLabelMap[pathName] || {
      title: pathName.charAt(0).toUpperCase() + pathName.slice(1),
      description: "Workspace page"
    };

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--app-bg)]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="button-secondary inline-flex h-11 w-11 items-center justify-center rounded-xl lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--accent)]">
              Workspace
            </p>
            <h1 className="dashboard-heading truncate text-2xl font-extrabold tracking-tight">
              {pageMeta.title}
            </h1>
            <p className="hidden text-sm text-slate-500 dark:text-slate-400 md:block">
              {pageMeta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="surface-card hidden items-center gap-3 rounded-xl px-3 py-2 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-extrabold text-[var(--accent)]">
              {userInitial}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">{user?.name || "Workspace User"}</p>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {user?.plan === "pro" ? "Pro plan" : "Free plan"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="button-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em]"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="button-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em]"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
