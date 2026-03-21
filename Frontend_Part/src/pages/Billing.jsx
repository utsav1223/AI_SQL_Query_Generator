import { useState } from "react";
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
import { useAuth } from "../hooks/useAuth";
import { paymentService } from "../services/paymentService";

const proFeatures = [
  "Unlimited SQL generation",
  "Advanced optimization insights",
  "Invoice and billing records",
  "Priority technical support"
];

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const callbackUrl = `${window.location.origin}/billingsuccess`;
      const link = await paymentService.createPaymentLink(callbackUrl);

      if (!link?.short_url) {
        throw new Error("Unable to initialize checkout.");
      }

      window.location.assign(link.short_url);
    } catch (requestError) {
      console.error("Payment Error:", requestError);
      setError(requestError?.message || "Unable to start payment right now. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112129] text-[#8fe1cf] shadow-[0_22px_38px_-28px_rgba(17,33,41,0.95)]">
              <Zap size={18} />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                AI SQL Studio
              </p>
              <h1 className="display-font text-2xl font-extrabold tracking-tight text-slate-950">
                Billing Center
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-900/8 bg-white/75 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700 transition-all hover:border-slate-900/16 hover:text-slate-950"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="public-card relative overflow-hidden rounded-[2.2rem] p-7 sm:p-9">
            <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-[#0f766e]/12 blur-3xl" />
            <div className="absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-[#c76b2d]/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0f766e]/12 bg-[#0f766e]/6 px-4 py-2 text-[#0f766e]">
                <Sparkles size={14} />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">
                  Professional Plan
                </span>
              </div>

              <h2 className="display-font mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Upgrade your workspace to Pro.
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-8 text-slate-600 sm:text-base">
                Unlock the complete SQL workflow with better generation freedom,
                query review tools, billing visibility, and a more capable SaaS experience.
              </p>

              <div className="mt-8 rounded-[1.9rem] bg-[#112129] p-7 text-white shadow-[0_36px_70px_-44px_rgba(17,33,41,0.98)] sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8fe1cf]">
                      Monthly Charge
                    </p>
                    <p className="display-font mt-3 text-5xl font-extrabold tracking-tight sm:text-6xl">
                      INR 499
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
                      Billed every 30 days
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/80">
                    Pro Access
                  </span>
                </div>

                <div className="mt-7 grid gap-3">
                  {proFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-[1.25rem] border border-white/8 bg-white/6 px-4 py-3.5"
                    >
                      <BadgeCheck size={16} className="text-[#8fe1cf]" />
                      <span className="text-sm font-semibold text-slate-100">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoTile
                  title="Activation"
                  text="Pro access becomes active immediately after payment verification."
                />
                <InfoTile
                  title="Manage Plan"
                  text="Use the dashboard to review invoices and subscription history."
                />
              </div>
            </div>
          </section>

          <section className="public-card rounded-[2.2rem] p-7 sm:p-9">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                Checkout
              </p>
              <h2 className="display-font mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                Secure payment flow
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                Your account details are shown below before we redirect you to Razorpay.
              </p>
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-slate-900/8 bg-white/76 p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Account Summary
              </p>

              <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
                <SummaryRow label="Name" value={user?.name || "Workspace Member"} />
                <SummaryRow label="Email" value={user?.email || "Not available"} breakWords />
                <SummaryRow label="Current Plan" value={user?.plan || "free"} uppercase />
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-[#0f766e]/14 bg-[#0f766e]/6 px-4 py-4">
              <p className="text-sm font-semibold leading-7 text-slate-800">
                You will be redirected to Razorpay for PCI-compliant checkout and payment verification.
              </p>
            </div>

            {error ? (
              <div className="mt-5 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#112129] px-5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LockKeyhole size={16} className="text-[#8fe1cf]" />
              )}
              {loading ? "Processing..." : "Continue To Secure Checkout"}
            </button>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <TrustBadge
                icon={<ShieldCheck size={15} className="text-[#0f766e]" />}
                label="Secure Checkout"
              />
              <TrustBadge
                icon={<CreditCard size={15} className="text-[#0f766e]" />}
                label="PCI Compliant"
              />
            </div>

            <p className="mt-5 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              Visa, Mastercard, UPI, and net banking supported
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, breakWords = false, uppercase = false }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span
        className={`text-right font-extrabold text-slate-950 ${
          breakWords ? "break-all" : ""
        } ${uppercase ? "uppercase" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoTile({ title, text }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-900/8 bg-white/76 p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">{text}</p>
    </div>
  );
}

function TrustBadge({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/8 bg-white/76 px-4 py-3">
      {icon}
      <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-700">
        {label}
      </span>
    </div>
  );
}
