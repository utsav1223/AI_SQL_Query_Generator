import { createElement } from "react";
import { Search } from "lucide-react";

const badgeToneClass = {
  default: "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  dark: "border-slate-900 bg-slate-900 text-white dark:border-slate-700 dark:bg-slate-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
};

export function PageHeader({ eyebrow, icon: Icon, title, description, action }) {
  return (
    <header className="border-b border-slate-100 pb-6 dark:border-slate-800">
      {eyebrow ? (
        <StatusBadge tone="default" icon={Icon ? <Icon size={14} className="text-emerald-600" /> : null}>
          {eyebrow}
        </StatusBadge>
      ) : null}
      <div className={eyebrow ? "mt-3" : ""}>
        <h1 className="dashboard-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </header>
  );
}

export function Panel({ as = "section", className = "", children }) {
  return createElement(as, { className: `dashboard-card rounded-lg ${className}` }, children);
}

export function MetricCard({ icon: Icon, label, value, helper, tone = "emerald" }) {
  return (
    <Panel as="article" className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">{value}</p>
          {helper ? <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{helper}</p> : null}
        </div>
        {Icon ? (
          <span className={`rounded-md p-2 ${tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
            <Icon size={18} />
          </span>
        ) : null}
      </div>
    </Panel>
  );
}

export function StatusBadge({ tone = "default", icon, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
        badgeToneClass[tone] || badgeToneClass.default
      } ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function IconButton({ onClick, label, danger = false, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
          : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, description, eyebrow }) {
  return (
    <Panel className="px-5 py-12 text-center">
      {Icon ? (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Icon size={26} />
        </div>
      ) : null}
      {eyebrow ? (
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
      ) : null}
      {title ? <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">{title}</h3> : null}
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </Panel>
  );
}

export function Pager({ page, pages, total, loading, onPrevious, onNext }) {
  return (
    <Panel className="flex flex-col gap-3 p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing page {page} of {pages} ({total} total)
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 1 || loading}
          className="rounded-md border border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= pages || loading}
          className="rounded-md border border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
        >
          Next
        </button>
      </div>
    </Panel>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
    </div>
  );
}

export function SelectControl({ icon, value, onChange, children }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
      <span className="text-slate-400">{icon}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 outline-none dark:text-slate-200"
      >
        {children}
      </select>
    </label>
  );
}

export function SkeletonBlock({ className = "" }) {
  return <div className={`rounded bg-slate-200 dark:bg-slate-700 ${className}`} />;
}
