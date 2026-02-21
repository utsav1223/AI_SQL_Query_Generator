import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import { CalendarDays, CheckCircle2, FileText, Loader2, Receipt } from "lucide-react";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await apiRequest("/payment/invoices", "GET");
        setInvoices(data);
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  if (loading) return <InvoiceSkeleton />;

  return (
    <div className="dashboard-page animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 pb-8 border-b border-slate-100">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billing Engine</span>
          </div>
          <h1 className="dashboard-heading text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">
            Invoice <span className="text-slate-400">Vault</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">Manage your subscriptions and transaction records.</p>
        </div>

        <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 px-5 py-3 rounded-[20px] self-start md:self-auto">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <div>
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Status</p>
            <p className="text-sm font-bold text-emerald-700 leading-none">Subscription Active</p>
          </div>
        </div>
      </div>

      <div className="min-h-[380px]">
        {invoices.length > 0 ? (
          <>
            <div className="md:hidden space-y-4">
              {invoices.map((inv) => (
                <div
                  key={inv._id}
                  className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <Receipt size={20} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Reference</p>
                        <p className="text-base font-bold text-slate-800">{inv.invoiceNumber}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-xl">
                      Paid
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-[28px] border-t border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Date</p>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                        <CalendarDays size={14} className="opacity-40" />
                        {new Date(inv.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">INR {inv.amount}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[740px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice ID</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billing Date</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="group hover:bg-slate-50/40 transition-all cursor-default">
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                            <FileText size={16} className="text-slate-400 group-hover:text-emerald-500" />
                          </div>
                          <span className="font-bold text-slate-700 tracking-tight">{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-2.5 text-slate-500 font-bold text-sm">
                          <CalendarDays size={14} className="opacity-30" />
                          {new Date(inv.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <span className="font-black text-slate-900 tracking-tight">INR {inv.amount}</span>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Paid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-100">
        <div className="flex flex-wrap justify-center gap-6">
          <TrustBadge label="PCI-DSS Compliant" />
          <TrustBadge label="256-bit SSL Encryption" />
          <TrustBadge label="Secure Checkout" />
        </div>
      </footer>
    </div>
  );
}

function TrustBadge({ label }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 size={12} className="text-slate-300" />
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-32 text-center bg-white border border-slate-200 rounded-[48px] shadow-sm animate-in zoom-in-95 duration-700">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-[32px] bg-slate-50 border border-slate-100 mb-6">
        <Receipt className="text-slate-200" size={36} />
      </div>
      <h3 className="text-slate-900 font-black text-2xl tracking-tight">No records found</h3>
      <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto px-6 leading-relaxed">
        Your billing cycle has not started yet. Your first invoice will appear here after upgrade.
      </p>
    </div>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="dashboard-page animate-pulse">
      <div className="h-12 w-64 bg-slate-100 rounded-xl mb-12" />
      <div className="hidden md:block bg-white border border-slate-100 rounded-[32px] overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 border-b border-slate-50 bg-slate-50/30" />
        ))}
      </div>
      <div className="md:hidden space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-slate-50 rounded-[28px]" />
        ))}
      </div>
    </div>
  );
}
