import { useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { NavLink, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isLoaded, orgId } = useClerkAuth();
  const workspaceKey = isLoaded ? orgId || "personal" : "loading";

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
        className={`fixed inset-y-0 left-0 z-50 w-[260px] transition-transform duration-200 ease-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="custom-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative flex min-h-full min-w-0 flex-col">
            <section className="min-w-0 flex-1 py-1">
              <Outlet key={workspaceKey} />
            </section>

            <footer className="px-4 pb-4 sm:px-6 lg:px-8">
              <div className="surface-card flex flex-col gap-3 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Workspace Active
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
        `text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
          isActive
            ? "text-[var(--accent)]"
            : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
