import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { billingService } from "../services/billingService";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyAndReturn = async () => {
      const params = new URLSearchParams(location.search);
      const payload = {
        razorpay_payment_link_id: params.get("razorpay_payment_link_id"),
        razorpay_payment_link_reference_id: params.get("razorpay_payment_link_reference_id"),
        razorpay_payment_link_status: params.get("razorpay_payment_link_status"),
        razorpay_payment_id: params.get("razorpay_payment_id"),
        razorpay_signature: params.get("razorpay_signature")
      };
      const hasPaymentLinkPayload = Object.values(payload).every(Boolean);

      try {
        if (hasPaymentLinkPayload) {
          await billingService.verifyPaymentLink(payload);
        }

        navigate("/dashboard/billing?payment=success", { replace: true });
      } catch {
        navigate("/dashboard/billing?payment=pending", { replace: true });
      }
    };

    verifyAndReturn();
  }, [location.search, navigate]);

  return (
    <div className="public-page flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="public-card w-full max-w-md rounded-lg p-6 text-center">
        <Loader2 className="mx-auto animate-spin text-[#0f766e]" size={32} />
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Billing
        </p>
        <h1 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Returning to billing
        </h1>
      </section>
    </div>
  );
}
