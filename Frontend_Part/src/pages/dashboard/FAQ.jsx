import { useMemo, useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = useMemo(
    () => [
      {
        id: "billing-1",
        question: "How do I upgrade?",
        answer:
          "Open Billing in the dashboard and choose the plan that fits your workspace."
      },
      {
        id: "usage-1",
        question: "What is the free plan limit?",
        answer:
          "Free users get 5 one-time credits. After all credits are used, upgrade to continue generating SQL."
      },
      {
        id: "invoice-1",
        question: "Where can I download invoices?",
        answer:
          "Open Dashboard > Invoices to review billing records and account payment details."
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
    <div className="dashboard-page max-w-[1100px] space-y-6">
      <header className="border-b border-slate-100 pb-6 dark:border-slate-800">
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
          <HelpCircle size={14} className="text-emerald-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">FAQ</span>
        </div>
        <h1 className="dashboard-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
          Quick answers for billing, usage limits, invoices, and support flow.
        </p>
      </header>

      <section className="space-y-4">
        {faqs.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-base">{item.question}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5">
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
