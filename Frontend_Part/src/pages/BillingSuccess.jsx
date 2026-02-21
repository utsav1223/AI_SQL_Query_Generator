import { useEffect, useState, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Zap,
  ShieldCheck,
  PartyPopper,
  Receipt
} from "lucide-react";

export default function BillingSuccess() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const verifyPaymentFromCallback = async () => {
      const params = new URLSearchParams(location.search);
      const razorpay_order_id = params.get("razorpay_order_id");
      const razorpay_payment_id = params.get("razorpay_payment_id");
      const razorpay_signature = params.get("razorpay_signature");
      const razorpay_payment_link_id = params.get("razorpay_payment_link_id");
      const razorpay_payment_link_reference_id = params.get("razorpay_payment_link_reference_id");
      const razorpay_payment_link_status = params.get("razorpay_payment_link_status");
      const hasOrderCallback = Boolean(
        razorpay_order_id && razorpay_payment_id && razorpay_signature
      );
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
          await apiRequest("/payment/verify", "POST", {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
          });
        } else if (hasPaymentLinkCallback) {
          await apiRequest("/payment/verify-payment-link", "POST", {
            razorpay_payment_link_id,
            razorpay_payment_link_reference_id,
            razorpay_payment_link_status,
            razorpay_payment_id,
            razorpay_signature
          });
        }

        const updatedUser = await apiRequest("/auth/me", "GET");
        await login({ token: localStorage.getItem("token"), user: updatedUser });
        setIsVerified(true);
      } catch (err) {
        console.error("Callback verification failed:", err);
        navigate("/billing", { replace: true });
      } finally {
        // Adding a slight delay for smoother transition
        setTimeout(() => setLoading(false), 1500);
      }
    };

    verifyPaymentFromCallback();
  }, [location.search, login, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="relative flex items-center justify-center mb-8">
          <Loader2 className="animate-spin text-emerald-500 relative z-10" size={48} strokeWidth={1.5} />
          <div className="absolute inset-0 blur-3xl bg-emerald-500/20 animate-pulse rounded-full" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-[11px]">Finalizing Transaction</p>
          <p className="text-slate-400 text-xs font-medium">Provisioning your Pro Intelligence environment...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans antialiased text-slate-900 flex flex-col selection:bg-emerald-100">
      
      {/* --- MINIMAL NAV --- */}
      <nav className="h-20 flex items-center justify-between px-6 lg:px-20 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
            <Zap size={20} className="text-emerald-400 fill-emerald-400" />
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-900">SQL Studio <span className="text-emerald-500">.</span></span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Encrypted</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-[480px] w-full text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* SUCCESS ANIMATION AREA */}
          <div className="mb-10 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white border-8 border-emerald-50 w-28 h-28 rounded-full flex items-center justify-center shadow-xl shadow-emerald-100 transition-transform hover:scale-105">
                <CheckCircle2 size={56} className="text-emerald-500" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* MESSAGE */}
          <div className="space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
              <PartyPopper size={12} /> Subscription Activated
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-slate-950">
              Welcome to <span className="text-emerald-500">Pro.</span>
            </h1>
            <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-[360px] mx-auto">
              Your account has been upgraded. Start leveraging enterprise-grade AI for your SQL workflows.
            </p>
          </div>

          {/* RECEIPT CARD (GLASSMORPHISM) */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 mb-10 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform">
               <Receipt size={120} />
            </div>
            
            <div className="space-y-6 relative z-10">
               <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account ID</p>
                  <p className="text-xs font-bold text-slate-900 truncate ml-8 tracking-tight">{user?.email}</p>
               </div>
               
               <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Scheduled Sync</p>
                  <div className="flex justify-between items-end">
                    <p className="text-xl font-black tracking-tight text-slate-900">
                       {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                       <span className="text-[10px] font-bold text-slate-500">Auto-renewal Active</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={() => navigate("/dashboard")}
            className="group w-full bg-slate-950 text-white py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-2xl shadow-slate-900/20 active:scale-95"
          >
            Launch Dashboard
            <ArrowRight size={18} className="text-emerald-400 group-hover:translate-x-1.5 transition-transform" />
          </button>

          {/* FOOTER NOTE */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] flex items-center gap-2">
               <CheckCircle2 size={12} className="text-emerald-500/50" /> 
               Payment verified by Razorpay Secure
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
