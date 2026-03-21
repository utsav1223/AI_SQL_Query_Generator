import { useContext, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark } = useContext(ThemeContext);

  return (
    <div className="dashboard-shell flex min-h-dvh overflow-hidden">
      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[292px] transition-transform duration-300 ease-out lg:translate-x-0 xl:w-[308px] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col lg:pl-[292px] xl:pl-[308px]">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="relative flex-1 overflow-y-auto custom-scrollbar">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-12 top-10 h-56 w-56 rounded-full bg-[#0f766e]/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#c76b2d]/8 blur-3xl" />
            <div className="absolute bottom-0 right-[8%] h-48 w-48 rounded-full bg-sky-400/8 blur-3xl" />
          </div>

          <div className="relative z-10 flex min-h-full flex-col">
            <section className="flex-1 pb-6 pt-2">
              <Outlet />
            </section>

            <footer
              className={`mx-4 mb-4 mt-auto rounded-[1.7rem] border px-5 py-4 backdrop-blur-xl sm:mx-6 sm:px-6 lg:mx-8 ${
                isDark
                  ? "border-slate-700/70 bg-slate-900/70 text-slate-200"
                  : "border-slate-900/8 bg-white/72 text-slate-700"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] ${
                      isDark
                        ? "border-[#8fe1cf]/18 bg-[#8fe1cf]/8 text-[#8fe1cf]"
                        : "border-[#0f766e]/12 bg-[#0f766e]/6 text-[#0f766e]"
                    }`}
                  >
                    <span className="animated-pulse-soft h-2 w-2 rounded-full bg-current" />
                    Workspace Active
                  </div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    AI SQL Studio Dashboard
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <FooterLink to="/dashboard/support" label="Support" />
                  <FooterLink to="/dashboard/faq" label="FAQ" />
                  <FooterLink to="/dashboard/feedback" label="Feedback" />
                </div>
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
        `text-[10px] font-extrabold uppercase tracking-[0.18em] transition-colors ${
          isActive ? "text-[#0f766e] dark:text-[#8fe1cf]" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
