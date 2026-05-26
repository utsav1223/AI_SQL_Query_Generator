import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Mail, Sparkles } from "lucide-react";
import { authService } from "../../services/authService";
import Modal from "./Modal";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onSwitchMode,
  recoveryEmail = ""
}) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recoveryEmail) {
      setEmail(recoveryEmail);
    }
  }, [recoveryEmail]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    if (!emailRegex.test(email.trim())) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setIsSubmitting(true);
    try {
      const nextEmail = email.trim();
      await authService.forgotPassword(nextEmail);
      onSwitchMode("reset", { email: nextEmail });
    } catch (error) {
      setErrors({
        server: error.message || "Unable to send OTP. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="inline-flex items-center gap-2 rounded-md border border-teal-100 bg-teal-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
          <Sparkles size={12} />
          Password Recovery
        </div>
        <h2 className="display-font mt-4 text-xl font-bold tracking-tight text-slate-950">
          Forgot password
        </h2>
        <p className="mt-2 text-[13px] font-medium leading-6 text-slate-500">
          Enter your email and we&apos;ll send a 6-digit OTP.
        </p>
      </div>

      <div className="px-5 py-5">
        {errors.server ? (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-700">
            {errors.server}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="forgot-email"
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
            >
              Recovery Email
            </label>

            <div
              className={`group flex items-center gap-2.5 rounded-md border px-3 py-2.5 transition-all ${
                errors.email
                  ? "border-rose-300 bg-rose-50/90"
                  : "border-slate-200 bg-white hover:border-slate-300 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100"
              }`}
            >
              <Mail
                size={16}
                className={
                  errors.email
                    ? "text-rose-500"
                    : "text-slate-400 transition-colors group-focus-within:text-teal-700"
                }
              />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors({});
                }}
                autoFocus
                placeholder="name@company.com"
                className="w-full bg-transparent text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>

            {errors.email ? (
              <p className="text-xs font-semibold text-rose-600">{errors.email}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send OTP"}
            {!isSubmitting ? <ArrowRight size={15} /> : null}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => onSwitchMode("login")}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-colors hover:text-teal-700"
          >
            <ArrowLeft size={14} />
            Back To Login
          </button>
        </div>
      </div>
    </Modal>
  );
}
