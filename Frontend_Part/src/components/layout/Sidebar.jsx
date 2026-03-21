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
  ShieldCheck,
  X
} from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

const workspaceLinks = [
  { to: "/dashboard", icon: LayoutGrid, label: "Overview" },
  { to: "/dashboard/generate", icon: Sparkles, label: "AI Workspace" },
  { to: "/dashboard/schema", icon: Database, label: "Schema Context" },
  { to: "/dashboard/history", icon: History, label: "Query History" }
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

  const shellClass = isDark
    ? "bg-[#081218] text-white border-r border-slate-700/60"
    : "bg-[#112129] text-white border-r border-white/8";

  return (
    <div className={`flex h-dvh flex-col px-5 py-5 shadow-[0_30px_70px_-46px_rgba(17,33,41,0.98)] lg:shadow-none ${shellClass}`}>
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-white/10 text-[#8fe1cf]">
            <Database size={20} />
          </span>
          <div>
            <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em] text-white">
              AI SQL Studio
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Query workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white/70 transition-colors hover:bg-white/8 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8fe1cf] text-[#112129]">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8fe1cf]">
              Workspace Plan
            </p>
            <p className="mt-2 text-base font-bold text-white">
              {user?.plan === "pro" ? "Pro Access Enabled" : "Free Workspace"}
            </p>
            <p className="mt-2 text-xs font-medium leading-6 text-white/60">
              {user?.plan === "pro"
                ? "Advanced tools and billing features are active."
                : "Upgrade when you want optimize, validate, and explain mode."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex-1 overflow-y-auto pr-1 custom-scrollbar">
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
                className="flex items-center justify-between rounded-[1.2rem] border border-dashed border-white/10 bg-white/4 px-4 py-3 text-white/40"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={17} />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">
                    {item.label}
                  </span>
                </div>
                <span className="rounded-full border border-white/8 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em]">
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

      <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-extrabold text-[#8fe1cf]">
            {user?.name?.trim()?.charAt(0)?.toUpperCase() || "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{user?.name || "Workspace User"}</p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/45">
              {user?.plan === "pro" ? "Professional plan" : "Free plan"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavSection({ title, children }) {
  return (
    <section className="mb-7">
      <p className="mb-3 px-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/38">
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
        `group flex items-center gap-3 rounded-[1.2rem] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.16em] transition-all ${
          isActive
            ? "bg-white text-[#112129] shadow-[0_20px_32px_-26px_rgba(255,255,255,0.7)]"
            : "text-white/68 hover:bg-white/8 hover:text-white"
        }`
      }
    >
      <span className="transition-transform duration-200 group-hover:translate-x-0.5">
        <Icon size={17} />
      </span>
      <span>{label}</span>
    </NavLink>
  );
}
