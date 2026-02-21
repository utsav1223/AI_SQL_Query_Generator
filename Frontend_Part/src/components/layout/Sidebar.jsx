import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { 
  LayoutGrid, Database, History, BarChart3, 
  Settings, CreditCard, FileText, Zap, ShieldCheck, X, Cpu,
  LifeBuoy, HelpCircle, MessageSquareQuote
} from "lucide-react";

export default function Sidebar({ onClose }) {
  const { user } = useContext(AuthContext);

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl transition-all duration-500 text-[11px] font-black uppercase tracking-[0.14em] border ${
      isActive
        ? "bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-300 scale-[1.02] z-10"
        : "text-slate-400 border-transparent hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <div className="w-[280px] sm:w-[300px] bg-white border-r border-slate-100 h-dvh flex flex-col p-5 sm:p-7 shadow-2xl lg:shadow-none animate-in slide-in-from-left duration-700">
      
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 p-3 rounded-2xl shadow-xl shadow-slate-200">
            <Cpu size={24} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-[0.3em] text-slate-950 uppercase leading-none mb-1">SQL Studio</h2>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest opacity-80">Neural Engine</span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar no-scrollbar pr-1 sm:pr-2">
        <NavGroup title="Workbench Hub">
          <SidebarLink to="/dashboard" icon={<LayoutGrid size={18} />} label="System Overview" linkClass={linkClass} />
          <SidebarLink to="/dashboard/generate" icon={<Zap size={18} />} label="Neural Logic" linkClass={linkClass} />
          <SidebarLink to="/dashboard/schema" icon={<Database size={18} />} label="Context Library" linkClass={linkClass} />
          <SidebarLink to="/dashboard/history" icon={<History size={18} />} label="Operation Logs" linkClass={linkClass} />
        </NavGroup>

        <NavGroup title="Management">
          {user?.plan === "pro" ? (
            <SidebarLink to="/dashboard/analytics" icon={<BarChart3 size={18} />} label="Advanced Stats" linkClass={linkClass} />
          ) : (
            <div className="flex items-center justify-between px-5 py-3.5 text-slate-300 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <BarChart3 size={18} />
                <span className="uppercase text-[10px] font-black tracking-widest">Analytics</span>
              </div>
              <ShieldCheck size={14} className="text-slate-200" />
            </div>
          )}
          <SidebarLink to="/dashboard/pricing" icon={<CreditCard size={18} />} label="Subscription" linkClass={linkClass} />
          <SidebarLink to="/dashboard/invoices" icon={<FileText size={18} />} label="Billing Records" linkClass={linkClass} />
          <SidebarLink to="/dashboard/settings" icon={<Settings size={18} />} label="Configuration" linkClass={linkClass} />
        </NavGroup>

        <NavGroup title="Help Desk">
          <SidebarLink to="/dashboard/support" icon={<LifeBuoy size={18} />} label="Contact Support" linkClass={linkClass} />
          <SidebarLink to="/dashboard/faq" icon={<HelpCircle size={18} />} label="FAQ" linkClass={linkClass} />
          <SidebarLink to="/dashboard/feedback" icon={<MessageSquareQuote size={18} />} label="Feedback" linkClass={linkClass} />
        </NavGroup>
      </div>

      {/* Modern Profile Footer */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 sm:gap-4 p-4 rounded-[24px] bg-slate-950 text-white shadow-xl shadow-slate-200 transition-all hover:scale-[1.01]">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 text-sm font-black ring-4 ring-slate-800">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black truncate tracking-wide">{user?.name || "Administrator"}</p>
            <div className="flex items-center gap-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${user?.plan === 'pro' ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-400'}`} />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {user?.plan === 'pro' ? 'Pro Instance' : 'Standard Node'}
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavGroup({ title, children }) {
  return (
    <div className="animate-in fade-in duration-1000">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.32em] px-4 sm:px-5 mb-4">{title}</p>
      <nav className="space-y-2">{children}</nav>
    </div>
  );
}

function SidebarLink({ to, icon, label, linkClass }) {
  return (
    <NavLink to={to} end className={linkClass}>
      <span className="shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">{icon}</span>
      <span className="flex-1 whitespace-nowrap">{label}</span>
    </NavLink>
  );
}
