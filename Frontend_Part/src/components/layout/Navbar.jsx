import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { LogOut, ChevronRight, ShieldCheck, Zap, Menu, Moon, Sun } from "lucide-react";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const pathName = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
  const routeLabelMap = {
    dashboard: "System Core",
    generate: "Neural Logic",
    schema: "Schema Definition",
    history: "Operation Logs",
    analytics: "Advanced Stats",
    pricing: "Subscription",
    invoices: "Billing Records",
    settings: "Configuration",
    support: "Contact Support",
    faq: "FAQ",
    feedback: "Feedback"
  };
  const formattedPath = routeLabelMap[pathName] || pathName.charAt(0).toUpperCase() + pathName.slice(1);

  return (
    <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-6 md:px-10 flex items-center justify-between">
      
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 border border-slate-100">
          <Menu size={20} />
        </button>

        <div className="flex flex-col">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Workspace</span>
            <ChevronRight size={12} className="text-slate-200" />
            <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-slate-200 max-w-[220px]">
               <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate">{formattedPath}</span>
            </div>
          </div>
          <p className="hidden md:block text-[11px] font-bold text-slate-400 mt-1">
            {user?.name ? `Signed in as ${user.name}` : "Authenticated workspace session"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-100 bg-white/80 text-slate-600 hover:text-emerald-600 hover:border-emerald-100 transition-all"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">
            {isDark ? "Light" : "Dark"}
          </span>
        </button>

        {/* Pro Badge (Tactile Design) */}
        <div className={`hidden sm:flex items-center gap-2.5 px-3 md:px-4 py-2 rounded-xl border transition-all ${
          user?.plan === 'pro' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm shadow-emerald-100' 
            : 'bg-slate-50 border-slate-100 text-slate-400'
        }`}>
          {user?.plan === "pro" ? <Zap size={12} fill="currentColor" className="animate-pulse" /> : <ShieldCheck size={12} />}
          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            {user?.plan === "pro" ? "Priority Compute" : "Standard Tier"}
          </span>
        </div>

        <div className="h-6 w-[1px] bg-slate-100 hidden md:block" />

        <button 
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all group font-black uppercase tracking-widest text-[10px]"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
