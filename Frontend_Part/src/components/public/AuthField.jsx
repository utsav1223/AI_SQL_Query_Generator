export default function AuthField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  rightSlot,
  autoComplete
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500"
      >
        {label}
      </label>
      <div
        className={`group flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition-all ${
          error
            ? "border-rose-300 ring-4 ring-rose-100/80"
            : "border-slate-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100"
        }`}
      >
        {Icon ? (
          <Icon
            size={18}
            className={error ? "text-rose-500" : "text-slate-400 group-focus-within:text-emerald-600"}
          />
        ) : null}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-300 outline-none"
        />

        {rightSlot}
      </div>

      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
