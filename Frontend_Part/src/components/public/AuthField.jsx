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
    <div className="space-y-2.5">
      <label
        htmlFor={name}
        className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500"
      >
        {label}
      </label>

      <div
        className={`group flex items-center gap-3 rounded-[1.35rem] border px-4 py-3.5 transition-all ${
          error
            ? "border-rose-300 bg-rose-50/70 ring-4 ring-rose-100/80"
            : "border-slate-900/8 bg-white/85 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.35)] hover:border-slate-900/14 focus-within:border-[#0f766e] focus-within:ring-4 focus-within:ring-[#0f766e]/10"
        }`}
      >
        {Icon ? (
          <Icon
            size={18}
            className={
              error
                ? "text-rose-500"
                : "text-slate-400 transition-colors group-focus-within:text-[#0f766e]"
            }
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
          className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
        />

        {rightSlot}
      </div>

      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
