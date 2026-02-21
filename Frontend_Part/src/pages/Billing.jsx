import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const proFeatures = [
  "Unlimited SQL generation",
  "Advanced optimization insights",
  "Invoice and billing records",
  "Priority technical support"
];

export default function Billing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const callbackUrl = `${window.location.origin}/billingsuccess`;
      const link = await apiRequest("/payment/create-payment-link", "POST", { callbackUrl });

      if (!link?.short_url) {
        throw new Error("Unable to initialize checkout.");
      }

      window.location.assign(link.short_url);
    } catch (err) {
      console.error("Payment Error:", err);
      setError(err?.message || "Unable to start payment right now. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:py-10">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-2.5 text-emerald-400 shadow-sm">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">SQL Studio</p>
              <p className="text-xl font-black tracking-tight text-slate-900">Billing Center</p>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </header>

        <main className="mt-8 grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Professional Plan</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Upgrade your workspace to Pro.
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              Get unlimited generation, deeper optimization support, and complete billing visibility for your SQL workflows.
            </p>

            <div className="mt-8 overflow-hidden rounded-3xl bg-slate-900 p-7 text-white sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Monthly Charge</p>
                  <p className="mt-2 text-5xl font-black tracking-tight sm:text-6xl">INR 499</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Billed every 30 days</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-200">
                  <Sparkles size={12} />
                  Pro Access
                </span>
              </div>

              <ul className="mt-7 grid gap-3">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
                    <BadgeCheck size={16} className="text-emerald-300" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Activation</p>
                <p className="mt-2 text-sm font-bold text-slate-900">Immediate after payment verification</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Manage Plan</p>
                <p className="mt-2 text-sm font-bold text-slate-900">Dashboard invoices and account controls</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Checkout</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Secure payment details</h2>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Account</p>
                <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Name</span>
                    <span className="text-right font-black text-slate-900">{user?.name || "Workspace Member"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Email</span>
                    <span className="break-all text-right font-black text-slate-900">{user?.email || "Not available"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500">Current Plan</span>
                    <span className="text-right font-black uppercase text-slate-900">{user?.plan || "free"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold leading-relaxed text-emerald-900">
                  You will be redirected to Razorpay to complete payment in a PCI-compliant checkout flow.
                </p>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                onClick={handlePayment}
                disabled={loading}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <LockKeyhole size={16} className="text-emerald-300" />}
                {loading ? "Processing..." : "Continue To Secure Checkout"}
              </button>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TrustBadge icon={<ShieldCheck size={15} className="text-emerald-600" />} label="Secure Checkout" />
                <TrustBadge icon={<CreditCard size={15} className="text-emerald-600" />} label="PCI Compliant" />
              </div>

              <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Visa, Mastercard, UPI and net banking supported
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function TrustBadge({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">{label}</span>
    </div>
  );
}
