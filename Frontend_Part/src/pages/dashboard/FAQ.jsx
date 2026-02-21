import { useMemo, useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = useMemo(
    () => [
      {
        id: "billing-1",
        question: "How do I upgrade to Pro?",
        answer:
          "Open Pricing in dashboard, click upgrade, complete Razorpay payment, and your plan updates automatically after verification."
      },
      {
        id: "billing-2",
        question: "Why does Billing Success redirect me back to Billing?",
        answer:
          "That happens when callback parameters are missing or signature verification fails. Use the payment flow from Billing page only."
      },
      {
        id: "usage-1",
        question: "What is the free plan limit?",
        answer:
          "Free users get 5 one-time credits. After all credits are used, upgrade to Pro to continue generating SQL."
      },
      {
        id: "invoice-1",
        question: "Where can I download invoices?",
        answer:
          "Open Dashboard > Billing Records. Paid invoices are listed there after successful verification."
      },
      {
        id: "support-1",
        question: "How can I contact support?",
        answer:
          "Go to Dashboard > Contact Support and use the support email channel shown there."
      }
    ],
    []
  );

  const [openId, setOpenId] = useState(faqs[0]?.id ?? null);

  return (
    <div className="dashboard-page max-w-[1100px] space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="border-b border-slate-100 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 mb-4">
          <HelpCircle size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FAQ</span>
        </div>
        <h1 className="dashboard-heading text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
          Frequently Asked <span className="text-emerald-500">Questions</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg mt-4 max-w-3xl">
          Quick answers for billing, usage limits, invoices, and support flow.
        </p>
      </header>

      <section className="space-y-4">
        {faqs.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="text-base md:text-lg font-black tracking-tight text-slate-900">{item.question}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6">
                  <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
