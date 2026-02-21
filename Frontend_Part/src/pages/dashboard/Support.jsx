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
    <div className="dashboard-page space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="border-b border-slate-100 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 mb-4">
          <LifeBuoy size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Support</span>
        </div>
        <h1 className="dashboard-heading text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
          Help <span className="text-emerald-500">Center</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg mt-4 max-w-3xl">
          Reach support for billing, account access, query generation issues, or plan upgrades.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
          className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-xl transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Mail size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email</p>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
            {SUPPORT_EMAIL}
          </h3>
          <p className="text-sm text-slate-500 mt-3">Open your mail app with a prefilled support request.</p>
        </a>

        <button
          onClick={() => navigate("/dashboard/faq")}
          className="text-left bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-xl transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <MessageSquare size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Self Service</p>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
            Open FAQ
          </h3>
          <p className="text-sm text-slate-500 mt-3">Check common fixes before raising a ticket.</p>
        </button>

        <button
          onClick={() => navigate("/dashboard/feedback")}
          className="text-left bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-xl transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
            <ExternalLink size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Product Input</p>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
            Share Feedback
          </h3>
          <p className="text-sm text-slate-500 mt-3">Tell us what to improve in your dashboard workflow.</p>
        </button>
      </section>

      <section className="bg-slate-900 text-white rounded-[32px] p-7 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">
              Security Notice
            </p>
            <h4 className="text-2xl font-black tracking-tight">Never share OTP or account password with anyone.</h4>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Verified Channel</span>
          </div>
        </div>
      </section>
    </div>
  );
}
