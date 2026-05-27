import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Receipt, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { paymentService } from "../services/paymentService";
import { logger } from "../utils/logger";

export default function BillingSuccess() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const verifyPaymentFromCallback = async () => {
      const params = new URLSearchParams(location.search);
      const razorpay_order_id = params.get("razorpay_order_id");
      const razorpay_payment_id = params.get("razorpay_payment_id");
      const razorpay_signature = params.get("razorpay_signature");
      const razorpay_payment_link_id = params.get("razorpay_payment_link_id");
      const razorpay_payment_link_reference_id = params.get("razorpay_payment_link_reference_id");
      const razorpay_payment_link_status = params.get("razorpay_payment_link_status");
      const hasOrderCallback = Boolean(razorpay_order_id && razorpay_payment_id && razorpay_signature);
      const hasPaymentLinkCallback = Boolean(
        razorpay_payment_link_id &&
          razorpay_payment_link_reference_id &&
          razorpay_payment_link_status &&
          razorpay_payment_id &&
          razorpay_signature
      );

      if (!hasOrderCallback && !hasPaymentLinkCallback) {
        navigate("/billing", { replace: true });
        return;
      }

      try {
        if (hasOrderCallback) {
          await paymentService.verifyPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
          });
        } else {
          await paymentService.verifyPaymentLink({
            razorpay_payment_link_id,
            razorpay_payment_link_reference_id,
            razorpay_payment_link_status,
            razorpay_payment_id,
            razorpay_signature
          });
        }

        const updatedUser = await authService.getCurrentUser();
        await login({ user: updatedUser });
        setIsVerified(true);
      } catch (err) {
        logger.error("Callback verification failed", err);
        navigate("/billing", { replace: true });
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    verifyPaymentFromCallback();
  }, [location.search, login, navigate]);

  if (loading) {
    return (
      <div className="public-page flex min-h-dvh items-center justify-center px-4 py-8">
        <section className="public-card w-full max-w-md rounded-lg p-6 text-center">
          <Loader2 className="mx-auto animate-spin text-[#0f766e]" size={32} />
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Razorpay Verification
          </p>
          <h1 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Verifying your secure payment
          </h1>
          <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
            We are verifying the payment and refreshing your account access.
          </p>
        </section>
      </div>
    );
  }

  if (!isVerified) {
    return null;
  }

  const renewalDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="public-page min-h-dvh px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl flex-col">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#112129] text-[#8fe1cf]">
              <Zap size={16} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">AI SQL Studio</p>
              <p className="display-font text-lg font-bold tracking-tight text-slate-950">Razorpay Verified</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 sm:flex">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Secure</span>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="public-card rounded-lg p-6 sm:p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              Razorpay Payment Verified
            </p>
            <h1 className="display-font mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Welcome to Pro.
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-600">
              Your account has been upgraded successfully. Advanced SQL tools, analytics, and billing records are now available.
            </p>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#112129] px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-all hover:bg-[#0f766e] sm:w-auto"
            >
              Launch Dashboard
              <ArrowRight size={15} />
            </button>
          </section>

          <section className="public-card rounded-lg p-5 sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <Receipt size={17} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Payment Receipt</h2>
                <p className="text-sm font-medium text-slate-500">Plan access and verification details</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <SummaryRow label="Account" value={user?.email || "Workspace member"} breakWords />
              <SummaryRow label="Plan" value="Professional" />
              <SummaryRow label="Valid Through" value={renewalDate} />
              <SummaryRow label="Status" value="Pro access active" />
            </div>

            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold leading-7 text-emerald-800">
                Payment verified by Razorpay Secure. You can review invoices from the dashboard billing section.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, breakWords = false }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white/70 px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className={`text-right text-sm font-bold text-slate-950 ${breakWords ? "break-all" : ""}`}>{value}</span>
    </div>
  );
}
