import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ArrowRight, Check, CreditCard, Shield, ShieldCheck, Sparkles, X, Zap } from "lucide-react";

export default function Pricing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="dashboard-page relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[420px] bg-gradient-to-b from-emerald-50/40 to-transparent -z-10" />

      <div className="text-center mb-14 space-y-5">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
          <Sparkles size={14} className="text-emerald-500 fill-emerald-500/20" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Tiers</span>
        </div>
        <h1 className="dashboard-heading text-4xl sm:text-6xl font-black text-slate-900 tracking-tight">
          Scale your <span className="text-emerald-600">intelligence.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Professional SQL orchestration tools for individuals and high-performance engineering teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch max-w-5xl mx-auto mb-16">
        <PlanCard
          name="Solo Explorer"
          price="INR 0"
          note="/month"
          badge="Starter"
          active={user?.plan === "free"}
          muted
          features={[
            { label: "5 free credits (one-time)", included: true },
            { label: "Standard logic engine", included: true },
            { label: "History sync (7 days)", included: true },
            { label: "Schema support", included: false },
            { label: "Optimization suite", included: false }
          ]}
          ctaLabel={user?.plan === "free" ? "Active Plan" : "Standard Tier"}
          ctaDisabled
          icon={<ShieldCheck size={22} />}
        />

        <PlanCard
          name="Pro Intelligence"
          price="INR 499"
          note="/month"
          badge="Most Popular"
          active={user?.plan === "pro"}
          dark
          features={[
            { label: "Unlimited monthly queries", included: true },
            { label: "Advanced SQL optimizer", included: true },
            { label: "Explain mode", included: true },
            { label: "Full history archive", included: true },
            { label: "Priority processing", included: true }
          ]}
          ctaLabel={user?.plan === "pro" ? "Subscription Active" : "Upgrade Now"}
          onCtaClick={() => navigate("/billing")}
          ctaDisabled={user?.plan === "pro"}
          icon={<Zap size={22} className="text-emerald-400" />}
        />
      </div>

      <div className="mt-8 space-y-6">
        <h3 className="text-center text-sm font-black text-slate-400 uppercase tracking-[0.35em]">Feature Comparison</h3>
        <div className="bg-white border border-slate-200 rounded-[28px] overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Capability</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-900 text-center">Starter</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-emerald-600 text-center">Pro Studio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <TableRow label="Neural Text-to-SQL" free={<CheckStatus active />} pro={<CheckStatus active />} />
              <TableRow label="Optimization Engine" free={<CheckStatus active={false} />} pro={<CheckStatus active />} />
              <TableRow label="Explain Mode" free={<CheckStatus active={false} />} pro={<CheckStatus active />} />
              <TableRow label="Analytics Dashboard" free={<CheckStatus active={false} />} pro={<CheckStatus active />} />
              <TableRow label="History Retention" free="7 Days" pro="Unlimited" />
              <TableRow label="Free Credits" free="5 Credits Total" pro="Unlimited" />
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-10 opacity-35">
          <Shield size={30} strokeWidth={1.5} />
          <div className="h-8 w-px bg-slate-300" />
          <CreditCard size={30} strokeWidth={1.5} />
        </div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.28em]">
          Secured by enterprise SSL | Razorpay secure checkout
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  note,
  badge,
  active,
  dark,
  muted,
  features,
  ctaLabel,
  onCtaClick,
  ctaDisabled,
  icon
}) {
  return (
    <div
      className={`relative rounded-[34px] p-7 md:p-9 flex flex-col transition-all border ${
        dark
          ? "bg-slate-950 border-slate-800 shadow-2xl"
          : "bg-white border-slate-200 shadow-sm hover:shadow-xl"
      }`}
    >
      {dark && <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />}

      <div className="flex items-center justify-between mb-7">
        <span
          className={`text-[10px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full ${
            dark ? "bg-emerald-500 text-slate-900" : "bg-slate-100 text-slate-500"
          }`}
        >
          {badge}
        </span>
        <div className={dark ? "text-emerald-400" : "text-slate-400"}>{icon}</div>
      </div>

      <h4 className={`text-xs font-black uppercase tracking-[0.24em] mb-4 ${dark ? "text-slate-500" : "text-slate-400"}`}>{name}</h4>
      <div className={`flex items-baseline gap-2 ${dark ? "text-white" : "text-slate-900"}`}>
        <span className="text-5xl md:text-6xl font-black tracking-tighter">{price}</span>
        <span className={`font-bold text-lg ${dark ? "text-slate-500" : "text-slate-400"}`}>{note}</span>
      </div>

      <ul className="space-y-4 my-10 flex-1">
        {features.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-3.5 text-sm ${
              item.included ? (dark ? "text-slate-300" : "text-slate-600") : "text-slate-300"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                item.included
                  ? dark
                    ? "bg-emerald-500/20"
                    : "bg-emerald-50"
                  : "bg-slate-100"
              }`}
            >
              {item.included ? (
                <Check size={13} className={dark ? "text-emerald-400" : "text-emerald-600"} strokeWidth={3} />
              ) : (
                <X size={13} className="text-slate-300" />
              )}
            </span>
            <span className="font-bold">{item.label}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCtaClick}
        disabled={ctaDisabled}
        className={`w-full py-4 rounded-[18px] font-black text-[11px] uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2 ${
          dark
            ? ctaDisabled
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20 active:scale-95"
            : "bg-slate-50 text-slate-400 border border-slate-100"
        } ${muted ? "cursor-not-allowed" : ""}`}
      >
        {ctaLabel}
        {!ctaDisabled && dark && <ArrowRight size={14} />}
      </button>

      {active && <div className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Current workspace plan</div>}
    </div>
  );
}

function TableRow({ label, free, pro }) {
  return (
    <tr className="hover:bg-slate-50/30 transition-colors">
      <td className="p-5 text-sm font-bold text-slate-600">{label}</td>
      <td className="p-5 text-sm font-bold text-slate-400 text-center">{free}</td>
      <td className="p-5 text-sm font-bold text-slate-900 text-center bg-emerald-50/30">{pro}</td>
    </tr>
  );
}

function CheckStatus({ active }) {
  return active ? (
    <Check size={18} className="text-emerald-500 mx-auto" strokeWidth={3} />
  ) : (
    <X size={18} className="text-slate-200 mx-auto" />
  );
}
