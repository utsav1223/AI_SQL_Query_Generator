import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sparkles, Sun } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

const routeLabelMap = {
  dashboard: {
    title: "Overview",
    description: "Your workspace summary and latest activity"
  },
  generate: {
    title: "AI Workspace",
    description: "Generate, optimize, validate, and explain SQL"
  },
  schema: {
    title: "Schema Context",
    description: "Manage the database structure used by the AI"
  },
  history: {
    title: "Query History",
    description: "Review saved prompts and generated SQL"
  },
  analytics: {
    title: "Analytics",
    description: "Track advanced usage and activity patterns"
  },
  pricing: {
    title: "Billing",
    description: "Upgrade your plan and compare features"
  },
  invoices: {
    title: "Invoices",
    description: "View payment records and billing history"
  },
  settings: {
    title: "Settings",
    description: "Manage profile, password, and account actions"
  },
  support: {
    title: "Support",
    description: "Reach the team and get help quickly"
  },
  faq: {
    title: "FAQ",
    description: "Common answers about the platform"
  },
  feedback: {
    title: "Feedback",
    description: "Share suggestions and product feedback"
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
    <header
      className={`sticky top-0 z-30 border-b backdrop-blur-2xl ${
        isDark
          ? "border-slate-700/70 bg-slate-950/70"
          : "border-slate-900/6 bg-white/68"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border lg:hidden ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-200"
                : "border-slate-900/8 bg-white text-slate-700"
            }`}
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0f766e]/12 bg-[#0f766e]/6 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e] dark:border-[#8fe1cf]/18 dark:bg-[#8fe1cf]/8 dark:text-[#8fe1cf]">
              <Sparkles size={12} />
              Active Workspace
            </div>
            <h1 className="display-font mt-2 truncate text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
              {pageMeta.title}
            </h1>
            <p className="mt-1 hidden text-sm font-medium text-slate-500 dark:text-slate-400 md:block">
              {pageMeta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`hidden items-center gap-3 rounded-full border px-3 py-2.5 sm:flex ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-200"
                : "border-slate-900/8 bg-white/78 text-slate-700"
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#112129] text-sm font-extrabold text-[#8fe1cf]">
              {userInitial}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {user?.name || "Workspace User"}
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {user?.plan === "pro" ? "Pro Plan" : "Free Plan"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600"
                : "border-slate-900/8 bg-white/78 text-slate-700 hover:border-slate-900/14"
            }`}
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
            className="inline-flex items-center gap-2 rounded-full bg-[#112129] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f766e]"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
