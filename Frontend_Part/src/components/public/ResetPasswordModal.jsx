import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, Sparkles } from "lucide-react";
import { authService } from "../../services/authService";
import Modal from "./Modal";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  visible,
  onToggle
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>

      <div
        className={`group flex items-center gap-2.5 rounded-md border px-3 py-2.5 transition-all ${
          error
            ? "border-rose-300 bg-rose-50/90"
            : "border-slate-200 bg-white hover:border-slate-300 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100"
        }`}
      >
        <Lock
          size={16}
          className={
            error
              ? "text-rose-500"
              : "text-slate-400 transition-colors group-focus-within:text-teal-700"
          }
        />
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-slate-400 transition-colors hover:text-teal-700"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  onSwitchMode,
  recoveryEmail = ""
}) {
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (!recoveryEmail) {
      return;
    }

    setForm((current) => ({ ...current, email: recoveryEmail }));
    setNotice("OTP sent to your email. Enter it below.");
    setResendTimer(30);
  }, [recoveryEmail]);

  useEffect(() => {
    if (!isOpen || resendTimer <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setResendTimer((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isOpen, resendTimer]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors({});
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !form.email) {
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(form.email);
      setNotice("OTP resent successfully.");
      setResendTimer(30);
    } catch (error) {
      setErrors({ server: error.message || "Failed to resend OTP." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};

    if (!/^[0-9]{6}$/.test(form.otp)) {
      next.otp = "OTP must be exactly 6 digits.";
    }
    if (!passwordRegex.test(form.password)) {
      next.password = "Use upper, lower, number, symbol, and 8+ characters.";
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await authService.verifyOtpAndReset({
        email: form.email,
        otp: form.otp,
        password: form.password
      });
      setNotice("Password updated successfully. Redirecting to login...");
      window.setTimeout(() => {
        onSwitchMode("login");
      }, 1000);
    } catch (error) {
      setErrors({ server: error.message || "Invalid or expired OTP." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="inline-flex items-center gap-2 rounded-md border border-teal-100 bg-teal-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
          <Sparkles size={12} />
          OTP Reset
        </div>
        <h2 className="display-font mt-4 text-xl font-bold tracking-tight text-slate-950">
          Reset with OTP
        </h2>
        <p className="mt-2 text-[13px] font-medium leading-6 text-slate-500">
          Use the code sent to your email and set a new password.
        </p>
      </div>

      <div className="px-5 py-5">
        {notice ? (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {errors.server ? (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-700">
            {errors.server}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="reset-email"
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
            >
              Email
            </label>
            <div className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Mail size={16} className="text-slate-400" />
              <input
                id="reset-email"
                value={form.email}
                readOnly
                className="w-full bg-transparent text-[13px] font-semibold text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="otp"
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
              >
                OTP Code
              </label>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || isSubmitting}
                className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                  resendTimer > 0 || isSubmitting
                    ? "text-slate-300"
                    : "text-teal-700 transition-colors hover:text-teal-800"
                }`}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>

            <div
              className={`group flex items-center gap-2.5 rounded-md border px-3 py-2.5 transition-all ${
                errors.otp
                  ? "border-rose-300 bg-rose-50/90"
                  : "border-slate-200 bg-white hover:border-slate-300 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100"
              }`}
            >
              <KeyRound
                size={16}
                className={
                  errors.otp
                    ? "text-rose-500"
                    : "text-slate-400 transition-colors group-focus-within:text-teal-700"
                }
              />
              <input
                id="otp"
                name="otp"
                value={form.otp}
                onChange={handleChange}
                maxLength={6}
                autoFocus
                placeholder="Enter 6-digit OTP"
                className="w-full bg-transparent text-[13px] font-semibold tracking-[0.18em] text-slate-900 placeholder:tracking-normal placeholder:text-slate-400 outline-none"
              />
            </div>
            {errors.otp ? <p className="text-xs font-semibold text-rose-600">{errors.otp}</p> : null}
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <PasswordField
              id="password"
              label="New Password"
              value={form.password}
              onChange={handleChange}
              placeholder="New password"
              error={errors.password}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              error={errors.confirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
            {!isSubmitting ? <ArrowRight size={15} /> : null}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => onSwitchMode("forgot", { email: form.email })}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-colors hover:text-teal-700"
          >
            <ArrowLeft size={14} />
            Back To Recovery
          </button>
        </div>
      </div>
    </Modal>
  );
}
