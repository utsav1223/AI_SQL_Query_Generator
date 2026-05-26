import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, CreditCard, Loader2, Shield, Sparkles, X, Zap } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { paymentService } from "../../services/paymentService";

const plans = [
  {
    name: "Starter",
    price: "INR 0",
    note: "/ month",
    badge: "Current",
    features: [
      { label: "5 one-time credits", included: true },
      { label: "Text-to-SQL generation", included: true },
      { label: "7-day history", included: true },
      { label: "Optimization tools", included: false },
      { label: "Analytics dashboard", included: false }
    ]
  },
  {
    name: "Professional",
    price: "INR 499",
    note: "/ month",
    badge: "Best value",
    highlighted: true,
    features: [
      { label: "Unlimited monthly queries", included: true },
      { label: "Advanced SQL optimizer", included: true },
      { label: "Explain mode", included: true },
      { label: "Full history archive", included: true },
      { label: "Priority processing", included: true }
    ]
  }
];

export default function Pricing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [downgrading, setDowngrading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleDowngrade = async () => {
    if (downgrading || user?.plan !== "pro") {
      return;
    }

    const confirmed = window.confirm(
      "Downgrade to the free plan? You will lose Pro-only tools and analytics immediately."
    );

    if (!confirmed) {
      return;
    }

    setDowngrading(true);
    setMessage("");
    setError("");

    try {
      const result = await paymentService.downgradePlan();
      const token = localStorage.getItem("token");

      if (result?.user && token) {
        await login({ token, user: result.user });
      }

      setMessage("Your workspace is now on the free plan.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to downgrade plan right now.");
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <div className="dashboard-page space-y-8">
      <header className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5">
          <Sparkles size={13} className="text-[var(--accent)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Billing
          </span>
        </div>
        <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
          Choose the workspace plan that fits your SQL workflow.
        </h1>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
          Start free, then upgrade when you need unlimited generations, optimization tools, and a full history archive.
        </p>
      </header>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        {plans.map((plan) => {
          const isProPlan = Boolean(plan.highlighted);
          const isFreePlan = !isProPlan;
          const isUserPro = user?.plan === "pro";
          const active =
            (isProPlan && isUserPro) || (isFreePlan && !isUserPro);
          const canUpgrade = isProPlan && !isUserPro;
          const canDowngrade = isFreePlan && isUserPro;
          const buttonLabel = active
            ? "Current Plan"
            : canDowngrade
            ? downgrading
              ? "Downgrading..."
              : "Downgrade To Free"
            : "Upgrade To Pro";
          const buttonDisabled = active || downgrading;
          const buttonIcon = canDowngrade && downgrading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : !active ? (
            <ArrowRight size={14} />
          ) : null;

          return (
            <article
              key={plan.name}
              className={`relative flex min-h-[430px] flex-col rounded-xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900 ${
                plan.highlighted
                  ? "border-slate-900 ring-1 ring-slate-900 dark:border-teal-400 dark:ring-teal-400"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {plan.highlighted ? (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-slate-900 to-teal-500" />
              ) : null}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                    {plan.badge}
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                    {plan.name}
                  </h2>
                </div>
                <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                  {active ? "Active" : "Plan"}
                </span>
              </div>

              <div className="mt-5 flex items-end gap-2">
                <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
                  {plan.price}
                </p>
                <p className="pb-1 text-xs font-semibold text-slate-500">{plan.note}</p>
              </div>

              <div className="my-6 h-px bg-slate-200 dark:bg-slate-700" />

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature.label} className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        feature.included ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-300"
                      }`}
                    >
                      {feature.included ? <Check size={13} /> : <X size={13} />}
                    </span>
                    <span
                      className={`text-[13px] font-semibold ${
                        feature.included ? "text-slate-700 dark:text-slate-200" : "text-slate-400"
                      }`}
                    >
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={buttonDisabled}
                onClick={() => {
                  if (canUpgrade) {
                    navigate("/billing");
                    return;
                  }

                  if (canDowngrade) {
                    handleDowngrade();
                  }
                }}
                className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] disabled:cursor-not-allowed ${
                  canUpgrade
                    ? "bg-[#10232d] text-white hover:bg-teal-700"
                    : canDowngrade
                    ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                    : "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {buttonIcon}
                {buttonLabel}
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Secure checkout
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Payments are processed through Razorpay with SSL-protected checkout.
            </p>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Shield size={22} strokeWidth={1.7} />
            <CreditCard size={22} strokeWidth={1.7} />
            <Zap size={22} strokeWidth={1.7} />
          </div>
        </div>
      </section>
    </div>
  );
}
