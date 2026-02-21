import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell flex min-h-dvh bg-[#FDFDFD] overflow-hidden font-sans antialiased text-slate-900">
      
      {/* 🔹 MOBILE OVERLAY (High Blur) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 🔹 SIDEBAR WRAPPER */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:w-[300px]
        ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative lg:pl-[300px]">
        
        {/* 🔹 NAVBAR */}
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        {/* 🔹 MAIN VIEWPORT (With Dynamic Mesh Gradient) */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-slate-50/30">
          {/* Decorative Mesh Gradient Background */}
          <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full" />

          <div className="w-full min-h-full flex flex-col relative z-10">
            
            {/* 🔹 CONTENT SECTION */}
            <section className="flex-1 py-2 md:py-3">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                <Outlet />
              </div>
            </section>
            
            {/* 🔹 ENTERPRISE FOOTER */}
            <footer className="px-4 sm:px-6 md:px-10 lg:px-12 py-7 mt-auto border-t border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-5 bg-white/70 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Secure</span>
                </div>
                <p className="text-[10px] text-center sm:text-left font-black text-slate-400 uppercase tracking-[0.2em]">
                  SQL Studio <span className="opacity-50 ml-1 font-medium italic">v2.4.0-Stable</span>
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                <FooterLink to="/dashboard/support" label="Contact Support" />
                <FooterLink to="/dashboard/faq" label="FAQ" />
                <FooterLink to="/dashboard/feedback" label="Feedback" />
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function FooterLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:translate-y-[-1px] ${
          isActive ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
