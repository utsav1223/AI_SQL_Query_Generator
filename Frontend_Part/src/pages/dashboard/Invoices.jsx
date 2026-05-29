import {
  AlertCircle,
  CalendarClock,
  Download,
  Loader2,
  ReceiptText,
  ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { billingService } from "../../services/billingService";

const invoiceSteps = [
  {
    title: "Choose a plan",
    description: "Upgrade or change your workspace plan from the Billing page."
  },
  {
    title: "Complete payment",
    description: "Finish checkout using your preferred payment method."
  },
  {
    title: "Review records",
    description: "Access receipts, payment methods, and subscription details from your account billing controls."
  }
];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError("");
        const records = await billingService.getInvoices();
        if (mounted) {
          setInvoices(Array.isArray(records) ? records : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load invoices");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInvoices();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dashboard-page space-y-6">
      <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
            <ReceiptText size={13} className="text-[var(--accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Billing records
            </span>
          </div>
          <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
            Invoices and payment history
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
            Review plan changes, receipts, and payment details from one focused place.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={ShieldCheck}
          title="Secure payments"
          description="Checkout and saved payment methods stay protected."
        />
        <InfoCard
          icon={CalendarClock}
          title="Plan timeline"
          description="Track current subscription status and renewal-related records."
        />
        <InfoCard
          icon={Download}
          title="Receipts"
          description="Download or review receipts from your account billing controls."
        />
      </section>

      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Billing flow
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-100">
              How to manage invoices
            </h2>
          </div>
          <span className="hidden rounded-md bg-[var(--accent-soft)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)] sm:inline-flex">
            Account billing
          </span>
        </div>

        <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
          {invoiceSteps.map((item, index) => (
            <div key={item.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Records
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-100">
              Payment history
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="animate-spin text-[var(--accent)]" size={26} />
          </div>
        ) : error ? (
          <div className="mt-5 flex gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : invoices.length === 0 ? (
          <p className="mt-5 text-sm font-semibold text-slate-600 dark:text-slate-400">
            No invoices found for this workspace yet.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-bold">Invoice</th>
                  <th className="px-3 py-2 font-bold">Plan</th>
                  <th className="px-3 py-2 font-bold">Amount</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                  <th className="px-3 py-2 font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {invoices.map((invoice) => (
                  <tr key={invoice._id || invoice.invoiceNumber}>
                    <td className="px-3 py-3 font-bold text-slate-950 dark:text-slate-100">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-3 py-3 capitalize text-slate-700 dark:text-slate-300">
                      {invoice.plan || "pro"}
                    </td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                      {invoice.currency || "INR"} {invoice.amount}
                    </td>
                    <td className="px-3 py-3 capitalize text-slate-700 dark:text-slate-300">
                      {invoice.status || "paid"}
                    </td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                      {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ icon, title, description }) {
  const Icon = icon;

  return (
    <article className="dashboard-card rounded-lg p-4">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon size={17} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-950 dark:text-slate-100">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
