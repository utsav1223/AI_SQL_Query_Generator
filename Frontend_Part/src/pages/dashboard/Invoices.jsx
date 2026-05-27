import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, FileText, Loader2, Receipt } from "lucide-react";
import { EmptyState, Panel, SkeletonBlock, StatusBadge } from "../../components/ui/DashboardUI";
import { paymentService } from "../../services/paymentService";
import { logger } from "../../utils/logger";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await paymentService.getInvoices();
        setInvoices(data);
      } catch (err) {
        logger.error("Invoice fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  if (loading) {
    return <InvoiceSkeleton />;
  }

  return (
    <div className="dashboard-page space-y-6">
      <Panel className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <StatusBadge tone="emerald" icon={<Receipt size={13} />}>
              Billing Records
            </StatusBadge>
            <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              Invoices
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              Review subscription payments, dates, amounts, and payment status in one clean ledger.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-300" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                Status
              </p>
              <p className="text-sm font-bold text-slate-950 dark:text-slate-100">Subscription Active</p>
            </div>
          </div>
        </div>
      </Panel>

      {invoices.length > 0 ? (
        <>
          <section className="grid gap-3 md:hidden">
            {invoices.map((invoice) => (
              <InvoiceCard key={invoice._id} invoice={invoice} />
            ))}
          </section>

          <Panel className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                  <tr>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Billing Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead align="right">Status</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <FileText size={15} />
                          </span>
                          <span className="text-sm font-bold text-slate-950 dark:text-slate-100">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <DateText value={invoice.createdAt} />
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-950 dark:text-slate-100">
                        INR {invoice.amount}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <PaidBadge />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      ) : (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Your first invoice will appear here after a successful plan upgrade."
        />
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <TrustBadge label="PCI-DSS Compliant" />
        <TrustBadge label="256-bit SSL Encryption" />
        <TrustBadge label="Secure Checkout" />
      </section>
    </div>
  );
}

function InvoiceCard({ invoice }) {
  return (
    <Panel as="article" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Receipt size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Reference
            </p>
            <p className="truncate text-sm font-bold text-slate-950 dark:text-slate-100">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <PaidBadge />
      </div>

      <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Billing Date
          </p>
          <DateText value={invoice.createdAt} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Amount
          </p>
          <p className="mt-2 text-lg font-bold text-slate-950 dark:text-slate-100">INR {invoice.amount}</p>
        </div>
      </div>
    </Panel>
  );
}

function TableHead({ children, align = "left" }) {
  const alignment = align === "right" ? "text-right" : "text-left";

  return (
    <th className={`px-5 py-3 ${alignment} text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400`}>
      {children}
    </th>
  );
}

function DateText({ value }) {
  return (
    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
      <CalendarDays size={14} className="text-slate-400" />
      {new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })}
    </div>
  );
}

function PaidBadge() {
  return (
    <StatusBadge tone="emerald" className="rounded-full px-3 py-1" icon={<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}>
      Paid
    </StatusBadge>
  );
}

function TrustBadge({ label }) {
  return (
    <Panel className="flex items-center gap-2 px-4 py-3">
      <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-300" />
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
        {label}
      </span>
    </Panel>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="dashboard-page space-y-6 animate-pulse">
      <Panel className="p-6">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-4 h-9 w-56" />
        <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
      </Panel>
      <Panel className="h-72">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      </Panel>
    </div>
  );
}
