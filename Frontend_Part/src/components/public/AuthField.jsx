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
      <label htmlFor={name} className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>

      <div
        className={`group flex items-center gap-2.5 rounded-md border px-3 py-2.5 transition-all ${
          error
            ? "border-rose-300 bg-rose-50/70 ring-4 ring-rose-100/80"
            : "border-slate-200 bg-white shadow-sm hover:border-slate-300 focus-within:border-[#0f766e] focus-within:ring-4 focus-within:ring-[#0f766e]/10"
        }`}
      >
        {Icon ? (
          <Icon
            size={16}
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
          className="w-full bg-transparent text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
        />

        {rightSlot}
      </div>

      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
