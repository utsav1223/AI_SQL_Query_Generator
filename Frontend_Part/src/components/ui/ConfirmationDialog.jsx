import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const toneClass = {
  danger: {
    icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
    confirm: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300"
  },
  warning: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    confirm: "bg-slate-900 text-white hover:bg-amber-600 disabled:bg-slate-400 dark:bg-amber-600 dark:hover:bg-amber-500"
  },
  default: {
    icon: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    confirm: "bg-slate-900 text-white hover:bg-emerald-600 disabled:bg-slate-400 dark:bg-emerald-600 dark:hover:bg-emerald-500"
  }
};

export default function ConfirmationDialog({ dialog, onClose }) {
  const [reason, setReason] = useState("");
  const [typedText, setTypedText] = useState("");

  if (!dialog) return null;

  const tone = toneClass[dialog.tone] || toneClass.default;
  const reasonMissing = dialog.requireReason && !reason.trim();
  const confirmationMissing = dialog.confirmText && typedText.trim() !== dialog.confirmText;
  const disabled = reasonMissing || confirmationMissing;

  const handleConfirm = () => {
    if (disabled) return;
    onClose({
      confirmed: true,
      reason: reason.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
              <AlertTriangle size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">{dialog.title}</h2>
              {dialog.description ? (
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {dialog.description}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose({ confirmed: false, reason: "" })}
            aria-label="Close dialog"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {dialog.requireReason ? (
          <label className="mt-5 block">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {dialog.reasonLabel}
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={dialog.reasonPlaceholder}
              className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-emerald-500/20"
            />
          </label>
        ) : null}

        {dialog.confirmText ? (
          <label className="mt-5 block">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Type {dialog.confirmText} to continue
            </span>
            <input
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-rose-500/20"
            />
          </label>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onClose({ confirmed: false, reason: "" })}
            className="rounded-md border border-slate-200 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={handleConfirm}
            className={`rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed ${tone.confirm}`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
