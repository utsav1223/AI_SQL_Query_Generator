import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  HelpCircle,
  Loader2,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import { paymentService } from "../services/paymentService";
import { logger } from "../utils/logger";

const proFeatures = [
  {
    title: "Unlimited monthly queries",
    description: "Generate, optimize, validate, format, and explain SQL without free credit limits.",
    icon: Zap
  },
  {
    title: "Advanced SQL optimizer",
    description: "Improve query shape and readability before you move it into real work.",
    icon: BadgeCheck
  },
  {
    title: "Full history archive",
    description: "Keep a reliable record of generated SQL and return to previous work quickly.",
    icon: FileText
  },
  {
    title: "Invoices and support",
    description: "Review billing records and use the dashboard support flow when you need help.",
    icon: Receipt
  }
];

const trustItems = [
  { label: "Razorpay checkout", icon: CreditCard },
  { label: "SSL protected", icon: ShieldCheck },
  { label: "Instant verification", icon: CheckCircle2 }
];

export default function Billing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { confirmAction, ConfirmationDialog } = useConfirmationDialog();
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
    : "After successful checkout";

  const handlePayment = async () => {
    if (isProUser) {
      navigate("/dashboard/pricing");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const link = await paymentService.createPaymentLink();

      if (!link?.short_url) {
        throw new Error("Unable to initialize checkout.");
      }

      window.location.assign(link.short_url);
    } catch (requestError) {
      logger.error("Payment link creation failed", requestError);
      setError(requestError?.message || "Unable to start payment right now. Please try again.");
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (downgrading || !isProUser) {
      return;
    }

    const result = await confirmAction({
      title: "Downgrade to Free",
      description: "Pro tools, analytics, and unlimited usage will stop immediately.",
      confirmLabel: "Downgrade",
      tone: "warning"
    });

    if (!result?.confirmed) {
      return;
    }

    setDowngrading(true);
    setError("");
    setMessage("");

    try {
      const result = await paymentService.downgradePlan();

      if (result?.user) {
        await login({ user: result.user });
      }

      setMessage("Your workspace has been downgraded to the free plan.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to downgrade plan right now.");
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <div className="public-page px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white/86 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#10232d] text-teal-300">
              <CreditCard size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                AI SQL Studio
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-950">
                Billing Center
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/dashboard/pricing")}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
            >
              Plans
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          </div>
        </header>

        {message ? <Alert tone="success" message={message} /> : null}
        {error ? <Alert tone="error" message={error} /> : null}

        <main className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-800">
                  <Sparkles size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                    {isProUser ? "Professional active" : "Professional plan"}
                  </span>
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {isProUser ? "Manage your Pro workspace." : "Upgrade to a cleaner SQL workflow."}
                </h2>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                  {isProUser
                    ? "Your subscription is active. Review billing details, open invoices, or move back to the free plan from one focused page."
                    : "Unlock unlimited generation, optimizer tools, explain mode, billing records, and priority workflow support with a secure checkout."}
                </p>
              </div>

              <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:w-[240px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Monthly charge
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {isProUser ? "Active" : "INR 499"}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {isProUser ? "Pro plan" : "Every 30 days"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-3">
              <PlanFact icon={BadgeCheck} label="Plan" value={isProUser ? "Professional" : "Upgrade ready"} />
              <PlanFact icon={CalendarDays} label={isProUser ? "Renewal" : "Activation"} value={renewalDate} />
              <PlanFact icon={ShieldCheck} label="Checkout" value="Razorpay secured" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {proFeatures.map((feature) => (
                <FeatureRow key={feature.title} feature={feature} />
              ))}
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {isProUser ? "Subscription" : "Checkout"}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {isProUser ? "Account and plan" : "Confirm your details"}
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {isProUser
                ? "Everything here is tied to your current signed-in workspace."
                : "We will send you to Razorpay after checking your account details."}
            </p>

            <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              <SummaryRow label="Name" value={user?.name || "Workspace Member"} />
              <SummaryRow label="Email" value={user?.email || "Not available"} breakWords />
              <SummaryRow label="Current plan" value={user?.plan || "free"} uppercase />
            </div>

            <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
              <div className="flex gap-3">
                <LockKeyhole size={17} className="mt-0.5 shrink-0 text-teal-700" />
                <p className="text-sm font-semibold leading-6 text-slate-800">
                  {isProUser
                    ? "Pro access includes unlimited usage, optimizer tools, analytics, invoices, and support."
                    : "Payment is handled through Razorpay. Your card, UPI, or net banking details are not stored by this app."}
                </p>
              </div>
            </div>

            {isProUser ? (
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/invoices")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white hover:bg-teal-700"
                >
                  <Receipt size={15} className="text-teal-200" />
                  View Invoices
                </button>
                <button
                  type="button"
                  onClick={handleDowngrade}
                  disabled={downgrading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {downgrading ? <Loader2 size={15} className="animate-spin" /> : null}
                  {downgrading ? "Downgrading..." : "Downgrade To Free"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePayment}
                disabled={loading}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <LockKeyhole size={15} />}
                {loading ? "Processing..." : "Continue To Checkout"}
              </button>
            )}

            <div className="mt-5 grid gap-2">
              {trustItems.map((item) => (
                <TrustRow key={item.label} item={item} />
              ))}
            </div>

            <p className="mt-5 flex items-center justify-center gap-2 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
              <HelpCircle size={13} />
              UPI, cards, net banking, and wallets supported
            </p>
          </aside>
        </main>
      </div>
      <ConfirmationDialog />
    </div>
  );
}

function Alert({ tone, message }) {
  const isSuccess = tone === "success";

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {message}
    </div>
  );
}

function PlanFact({ icon, label, value }) {
  const Icon = icon;

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-teal-700">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function FeatureRow({ feature }) {
  const Icon = feature.icon;

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
        <Icon size={16} />
      </span>
      <div>
        <h3 className="text-sm font-bold text-slate-950">{feature.title}</h3>
        <p className="mt-1 text-[13px] font-medium leading-6 text-slate-600">{feature.description}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, breakWords = false, uppercase = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="shrink-0 text-sm font-semibold text-slate-500">{label}</span>
      <span
        className={`text-right text-sm font-extrabold text-slate-950 ${
          breakWords ? "min-w-0 break-all" : ""
        } ${uppercase ? "uppercase" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function TrustRow({ item }) {
  const Icon = item.icon;

  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <Icon size={15} className="text-teal-700" />
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
        {item.label}
      </span>
    </div>
  );
}
