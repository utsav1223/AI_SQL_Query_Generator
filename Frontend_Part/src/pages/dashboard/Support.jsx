import { useMemo } from "react";
import { LifeBuoy, Mail, MessageSquare, ExternalLink, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SUPPORT_EMAIL = "support@sqlstudio.ai";

export default function Support() {
  const navigate = useNavigate();

  const subject = useMemo(() => encodeURIComponent("SQL Studio Support Request"), []);
  const body = useMemo(
    () =>
      encodeURIComponent(
        "Hi Support Team,\n\nI need help with:\n\nAccount email:\nIssue details:\n\nThanks."
      ),
    []
  );

  return (
    <div className="dashboard-page space-y-6">
      <header className="border-b border-slate-100 pb-6 dark:border-slate-800">
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
          <LifeBuoy size={14} className="text-emerald-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Contact Support</span>
        </div>
        <h1 className="dashboard-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
          Help Center
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
          Reach support for billing, account access, query generation issues, or plan upgrades.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
          className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <Mail size={17} />
          </div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Email</p>
          <h3 className="break-all text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-slate-100">
            {SUPPORT_EMAIL}
          </h3>
          <p className="mt-3 text-[13px] leading-6 text-slate-500">Open your mail app with a prefilled support request.</p>
        </a>

        <button
          onClick={() => navigate("/dashboard/faq")}
          className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <MessageSquare size={17} />
          </div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Self Service</p>
          <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-slate-100">
            Open FAQ
          </h3>
          <p className="mt-3 text-[13px] leading-6 text-slate-500">Check common fixes before raising a ticket.</p>
        </button>

        <button
          onClick={() => navigate("/dashboard/feedback")}
          className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-violet-50 text-violet-600">
            <ExternalLink size={17} />
          </div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Product Input</p>
          <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-slate-100">
            Share Feedback
          </h3>
          <p className="mt-3 text-[13px] leading-6 text-slate-500">Tell us what to improve in your dashboard workflow.</p>
        </button>
      </section>

      <section className="rounded-lg bg-slate-900 p-5 text-white shadow-xl md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
              Security Notice
            </p>
            <h4 className="text-xl font-bold tracking-tight">Never share OTP or account password with anyone.</h4>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-200">Verified Channel</span>
          </div>
        </div>
      </section>
    </div>
  );
}
