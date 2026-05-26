import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
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
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isProUser = user?.plan === "pro";
  const renewalDate = user?.billingRenewal
    ? new Date(user.billingRenewal).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "Next cycle";

  const handlePayment = async () => {
    if (isProUser) {
      navigate("/dashboard/pricing");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

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

  const handleDowngrade = async () => {
    if (downgrading || !isProUser) {
      return;
    }

    const confirmed = window.confirm(
      "Downgrade to the free plan? Pro tools, analytics, and unlimited usage will stop immediately."
    );

    if (!confirmed) {
      return;
    }

    setDowngrading(true);
    setError("");
    setMessage("");

    try {
      const result = await paymentService.downgradePlan();
      const token = localStorage.getItem("token");

      if (result?.user && token) {
        await login({ token, user: result.user });
      }

      setMessage("Your workspace has been downgraded to the free plan.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to downgrade plan right now.");
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <div className="public-page px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#112129] text-[#8fe1cf] shadow-[0_22px_38px_-28px_rgba(17,33,41,0.95)]">
              <Zap size={16} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                AI SQL Studio
              </p>
              <h1 className="display-font text-xl font-bold tracking-tight text-slate-950">
                Billing Center
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/75 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="public-card rounded-lg p-5 sm:p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#0f766e]/12 bg-[#0f766e]/6 px-3 py-1.5 text-[#0f766e]">
                <Sparkles size={13} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                  {isProUser ? "Professional Active" : "Professional Plan"}
                </span>
              </div>

              <h2 className="display-font mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {isProUser ? "Your Pro workspace is active." : "Upgrade your workspace to Pro."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600">
                {isProUser
                  ? "Manage your subscription, review invoices, or move back to the free plan from one billing surface."
                  : "Unlock the complete SQL workflow with better generation freedom, query review tools, billing visibility, and a more capable SaaS experience."}
              </p>

              <div className="mt-6 rounded-lg bg-[#112129] p-5 text-white shadow-[0_36px_70px_-44px_rgba(17,33,41,0.98)] sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8fe1cf]">
                      Monthly Charge
                    </p>
                    <p className="display-font mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                      {isProUser ? "Pro Active" : "INR 499"}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
                      {isProUser ? `Renewal: ${renewalDate}` : "Billed every 30 days"}
                    </p>
                  </div>
                  <span className="rounded-md border border-white/10 bg-white/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
                    Pro Access
                  </span>
                </div>

                <div className="mt-6 grid gap-2.5">
                  {proFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-md border border-white/8 bg-white/6 px-3 py-2.5"
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

          <section className="public-card rounded-lg p-5 sm:p-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {isProUser ? "Plan Management" : "Checkout"}
              </p>
              <h2 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950">
                {isProUser ? "Manage your subscription" : "Secure payment flow"}
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                {isProUser
                  ? "Your current plan is active. You can review invoices or downgrade to the free plan."
                  : "Your account details are shown below before we redirect you to Razorpay."}
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-white/76 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Account Summary
              </p>

              <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
                <SummaryRow label="Name" value={user?.name || "Workspace Member"} />
                <SummaryRow label="Email" value={user?.email || "Not available"} breakWords />
                <SummaryRow label="Current Plan" value={user?.plan || "free"} uppercase />
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-[#0f766e]/14 bg-[#0f766e]/6 px-4 py-4">
              <p className="text-sm font-semibold leading-7 text-slate-800">
                {isProUser
                  ? "Pro access includes unlimited generation, optimizer tools, analytics, invoices, and priority support."
                  : "You will be redirected to Razorpay for PCI-compliant checkout and payment verification."}
              </p>
            </div>

            {message ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            {isProUser ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/invoices")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#112129] px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-[#0f766e]"
                >
                  <CheckCircle2 size={16} className="text-[#8fe1cf]" />
                  View Invoices
                </button>
                <button
                  type="button"
                  onClick={handleDowngrade}
                  disabled={downgrading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-rose-700 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {downgrading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {downgrading ? "Downgrading..." : "Downgrade Free"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePayment}
                disabled={loading}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#112129] px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LockKeyhole size={16} className="text-[#8fe1cf]" />
                )}
                {loading ? "Processing..." : "Continue To Secure Checkout"}
              </button>
            )}

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
    <div className="rounded-lg border border-slate-200 bg-white/76 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function TrustBadge({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/76 px-3 py-2.5">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
        {label}
      </span>
    </div>
  );
}
