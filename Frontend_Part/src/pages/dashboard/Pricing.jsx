import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrganization } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  WalletCards
} from "lucide-react";
import { billingService } from "../../services/billingService";
import { useAuth } from "../../hooks/useAuth";
import { getPlanLabel, hasPlan } from "../../utils/planAccess";

const PLAN_CARDS = [
  {
    id: "free",
    name: "Free",
    price: "INR 0",
    note: "/ month",
    icon: Sparkles,
    scope: "personal",
    badge: "Starter",
    description: "For trying schema-aware SQL generation.",
    metrics: ["5 credits", "Standard SQL", "Latest 10 history"],
    features: [
      "Text-to-SQL generation",
      "1 saved schema context",
      "Copy and download SQL",
      "Basic usage overview"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: "INR 499",
    note: "/ month",
    icon: UserRound,
    scope: "personal",
    badge: "Best for individuals",
    highlighted: true,
    description: "For one person doing serious SQL work.",
    metrics: ["Full archive", "Pro tools", "Analytics"],
    features: [
      "Generate schema from English",
      "Optimize, format, validate, explain",
      "All SQL dialects",
      "Pins, favorites, tags, and analytics"
    ]
  },
  {
    id: "team",
    name: "Team",
    price: "INR 1499",
    note: "/ month",
    icon: Users,
    scope: "personal",
    scopeLabel: "Team workspace",
    badge: "For teams",
    description: "Unlock team workspace creation and shared SQL work.",
    metrics: ["5 seats", "All Pro", "Org tools"],
    features: [
      "Everything in Pro",
      "Create a team workspace after payment",
      "Shared schema and query history",
      "Member controls for collaboration"
    ]
  }
];

const PAYMENT_METHODS = [
  {
    id: "visa",
    label: "Visa",
    detail: "Credit and debit cards",
    icon: CreditCard
  },
  {
    id: "mastercard",
    label: "Mastercard",
    detail: "Credit and debit cards",
    icon: CreditCard
  },
  {
    id: "rupay",
    label: "RuPay",
    detail: "Domestic card network",
    icon: CreditCard
  },
  {
    id: "upi",
    label: "UPI",
    detail: "Apps, QR, and collect",
    icon: WalletCards
  },
  {
    id: "netbanking",
    label: "NetBanking",
    detail: "Major Indian banks",
    icon: Landmark
  },
  {
    id: "wallets",
    label: "Wallets",
    detail: "Supported by Razorpay",
    icon: WalletCards
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, refreshCurrentUser } = useAuth();
  const { organization } = useOrganization();
  const [billing, setBilling] = useState(user?.billing || null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const reviewRef = useRef(null);

  const workspace = useMemo(() => {
    const orgId = billing?.clerkOrgId || user?.activeWorkspace?.orgId || organization?.id || null;
    const scope = billing?.scope || user?.billing?.scope || (orgId ? "organization" : "personal");

    return {
      scope,
      orgId,
      name: scope === "organization" ? organization?.name || "Organization workspace" : "Personal workspace"
    };
  }, [billing, organization?.id, organization?.name, user?.activeWorkspace?.orgId, user?.billing?.scope]);

  const currentPlan =
    billing?.plan || (workspace.scope === "organization" ? "free" : user?.plan || "free");
  const canManageBilling = billing?.canManageBilling ?? true;
  const selectedPlan = PLAN_CARDS.find((plan) => plan.id === selectedPlanId);
  const WorkspaceIcon = workspace.scope === "organization" ? Building2 : UserRound;

  const buildFallbackBilling = useCallback(() => ({
    scope: organization?.id ? "organization" : "personal",
    clerkOrgId: organization?.id || null,
    plan: organization?.id ? user?.billing?.plan || "free" : user?.plan || "free",
    status: user?.billingStatus || user?.billing?.status || "free",
    renewal: user?.billingRenewal || user?.billing?.renewal || null,
    canManageBilling: true
  }), [organization?.id, user?.billing?.plan, user?.billing?.renewal, user?.billing?.status, user?.billingRenewal, user?.billingStatus, user?.plan]);

  useEffect(() => {
    let mounted = true;

    const loadBilling = async () => {
      try {
        setLoading(true);
        setError("");
        const current = await billingService.getCurrent();
        if (mounted) {
          setBilling(current);
        }
      } catch (err) {
        if (mounted) {
          setBilling(buildFallbackBilling());
          setError(err.status === 404 ? "" : err.message || "Unable to load billing state");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBilling();

    return () => {
      mounted = false;
    };
  }, [buildFallbackBilling, organization?.id, user?.activeWorkspaceKey]);

  const refreshBilling = async () => {
    const [current] = await Promise.all([
      billingService.getCurrent(),
      refreshCurrentUser?.()
    ]);
    setBilling(current);
  };

  const startCheckout = async (plan) => {
    const planConfig = PLAN_CARDS.find((item) => item.id === plan);
    if (!planConfig || plan === "free") {
      return;
    }

    setBusyPlan(plan);
    setError("");

    try {
      const paymentLink = await billingService.createPaymentLink({
        plan,
        scope: plan === "team" ? "personal" : planConfig.scope
      });

      if (!paymentLink?.short_url) {
        throw new Error("Razorpay did not return a checkout link.");
      }

      window.location.assign(paymentLink.short_url);
    } catch (err) {
      setError(err.message || "Unable to start checkout");
      setBusyPlan("");
    }
  };

  const openBillingReview = (planId) => {
    setSelectedPlanId(planId);
    setError("");

    window.requestAnimationFrame(() => {
      reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const downgrade = async () => {
    setBusyPlan("free");
    setError("");

    try {
      await billingService.downgrade({ scope: workspace.scope });
      await refreshBilling();
    } catch (err) {
      setError(err.message || "Unable to downgrade plan");
    } finally {
      setBusyPlan("");
    }
  };

  const getAction = (plan) => {
    if (plan.id === "free") {
      if (currentPlan === "free") {
        return { label: "Current plan", disabled: true };
      }

      return { label: "Downgrade", onClick: downgrade };
    }

    if (currentPlan === plan.id) {
      return { label: "Current plan", disabled: true };
    }

    if (hasPlan(currentPlan, plan.id) && plan.id !== "team") {
      return { label: `Included in ${getPlanLabel(currentPlan)}`, disabled: true };
    }

    if (plan.id === "pro" && workspace.scope === "organization") {
      return {
        label: "Use personal workspace",
        onClick: () => {
          setError("Switch back to your personal workspace before buying Pro.");
          navigate("/dashboard/settings");
        }
      };
    }

    return {
      label: plan.id === "team" ? "Review Team" : "Review Pro",
      onClick: () => openBillingReview(plan.id)
    };
  };

  return (
    <div className="dashboard-page space-y-6">
      <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
              <CreditCard size={13} className="text-[var(--accent)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Billing
              </span>
            </div>
            <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              Plans, payment, and workspace billing
            </h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              Manage personal Pro access or buy Team to unlock organization workspaces with Razorpay checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard/invoices")}
            className="button-secondary inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em]"
          >
            <ReceiptText size={15} />
            Invoices
          </button>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="dashboard-card rounded-lg p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                <WorkspaceIcon size={21} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Active workspace
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-100">
                  {workspace.name}
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
                  {workspace.scope === "organization"
                    ? currentPlan === "team"
                      ? "Team is active for this organization."
                      : "This organization needs Team before shared SQL tools are available."
                    : "Pro is for solo work. Team unlocks organization creation and shared SQL collaboration."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[440px]">
              <StatusTile label="Current plan" value={getPlanLabel(currentPlan)} />
              <StatusTile label="Status" value={billing?.status || currentPlan} />
              <StatusTile
                label="Renewal"
                value={billing?.renewal ? new Date(billing.renewal).toLocaleDateString() : "N/A"}
              />
            </div>
          </div>
        </div>

        <div className="dashboard-card rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Billing owner
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                {workspace.scope === "organization"
                  ? canManageBilling
                    ? "You can manage billing for this organization."
                    : "Only organization admins or billing managers can change this plan."
                  : "You can manage your personal Pro or Team subscription here."}
              </p>
            </div>
          </div>
          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="dashboard-card rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Accepted payments
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-100">
              Secure checkout through Razorpay
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            <LockKeyhole size={14} className="text-[var(--accent)]" />
            PCI-compliant payment flow
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {PAYMENT_METHODS.map((method) => (
            <PaymentMethod key={method.id} method={method} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Pricing
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
              Choose a plan for your account
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
            Free and Pro users stay in personal workspace. Team unlocks organization creation and shared SQL features.
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Team workspace is part of the Team plan. Upgrade first, then create or select an organization for shared schema context, organization history, member collaboration, and paid AI tools.
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {PLAN_CARDS.map((plan) => {
            const action = getAction(plan);
            const isBusy = busyPlan === plan.id;
            const isCurrent = currentPlan === plan.id;

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                action={action}
                isBusy={isBusy}
                isCurrent={isCurrent}
                disabled={action.disabled || Boolean(busyPlan) || loading}
              />
            );
          })}
        </div>
      </section>

      {selectedPlan && selectedPlan.id !== "free" ? (
        <section ref={reviewRef} className="dashboard-card rounded-lg p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[var(--accent-soft-strong)] bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">
                <CreditCard size={13} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                  Billing review
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                Confirm {selectedPlan.name} before checkout.
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
                Review the workspace, plan, and amount first. Razorpay opens only after confirmation.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ReviewTile
                  label="Workspace"
                  value={selectedPlan.id === "team" ? "Team workspace entitlement" : workspace.name}
                />
                <ReviewTile label="Plan" value={selectedPlan.name} />
                <ReviewTile label="Amount" value={`${selectedPlan.price} ${selectedPlan.note}`} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {selectedPlan.features.map((feature) => (
                  <FeatureLine key={feature}>{feature}</FeatureLine>
                ))}
              </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Order summary
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-100">
                    AI SQL Studio {selectedPlan.name}
                  </h3>
                </div>
                <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                  Razorpay
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                <SummaryRow label="Scope" value={selectedPlan.scopeLabel || selectedPlan.scope} />
                <SummaryRow label="Billing" value="Monthly" />
                <SummaryRow label="Due today" value={selectedPlan.price} strong />
              </div>

              <button
                type="button"
                className="button-primary mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold"
                disabled={Boolean(busyPlan)}
                onClick={() => startCheckout(selectedPlan.id)}
              >
                {busyPlan === selectedPlan.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Continue To Razorpay
              </button>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.slice(0, 3).map((method) => (
                  <MiniBrand key={method.id} method={method} />
                ))}
              </div>

              <p className="mt-4 text-xs font-semibold leading-6 text-slate-500 dark:text-slate-400">
                Payment details are handled by Razorpay. This app stores only verified billing records.
              </p>
            </aside>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatusTile({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold capitalize text-slate-950 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function PaymentMethod({ method }) {
  const Icon = method.icon;

  return (
    <article className="min-h-[116px] rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <PaymentBrand method={method} />
        <Icon size={17} className="text-[var(--accent)]" />
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {method.detail}
      </p>
    </article>
  );
}

function PaymentBrand({ method }) {
  if (method.id === "mastercard") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative flex h-7 w-12 shrink-0 items-center">
          <span className="absolute left-0 h-7 w-7 rounded-full bg-[#eb001b]" />
          <span className="absolute left-5 h-7 w-7 rounded-full bg-[#f79e1b] opacity-90" />
        </span>
        <span className="text-sm font-black tracking-tight text-slate-950 dark:text-slate-100">
          mastercard
        </span>
      </div>
    );
  }

  if (method.id === "visa") {
    return <span className="text-2xl font-black italic tracking-tight text-[#1434cb]">VISA</span>;
  }

  if (method.id === "rupay") {
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-xl font-black italic tracking-tight text-[#1b4d89] dark:text-sky-300">RuPay</span>
        <span className="flex items-center gap-0.5">
          <span className="h-4 w-2 skew-x-[-18deg] bg-[#f58220]" />
          <span className="h-4 w-2 skew-x-[-18deg] bg-[#2ca44f]" />
        </span>
      </span>
    );
  }

  if (method.id === "upi") {
    return (
      <span className="flex items-center gap-2">
        <span className="flex items-center gap-0.5">
          <span className="h-6 w-2 skew-x-[-20deg] bg-[#1f9d55]" />
          <span className="h-6 w-2 skew-x-[-20deg] bg-[#f59e0b]" />
        </span>
        <span className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">UPI</span>
      </span>
    );
  }

  return (
    <span className="text-base font-black tracking-tight text-slate-950 dark:text-slate-100">
      {method.label}
    </span>
  );
}

function MiniBrand({ method }) {
  return (
    <div className="flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900">
      <span className="max-w-full truncate text-[10px] font-black uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">
        {method.label}
      </span>
    </div>
  );
}

function PlanCard({ plan, action, isBusy, isCurrent, disabled }) {
  const Icon = plan.icon;

  return (
    <article
      className={`dashboard-card flex min-h-[430px] flex-col rounded-lg p-5 ${
        plan.highlighted ? "border-[var(--accent)] ring-1 ring-[var(--accent-soft)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon size={20} />
        </span>
        <span
          className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            isCurrent
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {isCurrent ? "Current" : plan.badge}
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-bold text-slate-950 dark:text-slate-100">
        {plan.name}
      </h3>
      <p className="mt-2 min-h-[48px] text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
        {plan.description}
      </p>

      <div className="mt-5 flex items-end gap-2">
        <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
          {plan.price}
        </p>
        <span className="pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {plan.note}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {plan.metrics.map((metric) => (
          <span
            key={metric}
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
          >
            {metric}
          </span>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {plan.features.map((feature) => (
          <FeatureLine key={feature}>{feature}</FeatureLine>
        ))}
      </div>

      <button
        type="button"
        className={`mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold ${
          action.disabled ? "button-secondary opacity-70" : plan.highlighted ? "button-primary" : "button-secondary"
        }`}
        disabled={disabled}
        onClick={action.onClick}
      >
        {isBusy ? <Loader2 size={16} className="animate-spin" /> : null}
        {action.label}
      </button>
    </article>
  );
}

function FeatureLine({ children }) {
  return (
    <div className="flex gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
      <Check size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
      <span>{children}</span>
    </div>
  );
}

function ReviewTile({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold capitalize text-slate-950 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`text-right text-sm capitalize ${
          strong ? "font-extrabold text-slate-950 dark:text-slate-100" : "font-bold text-slate-700 dark:text-slate-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
