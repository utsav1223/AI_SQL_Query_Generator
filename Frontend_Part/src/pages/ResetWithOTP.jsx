import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, KeyRound, Lock, RefreshCw } from "lucide-react";
import { apiRequest } from "../services/api";
import PublicAuthLayout from "../components/public/PublicAuthLayout";
import AuthField from "../components/public/AuthField";

export default function ResetWithOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || "";

  const [form, setForm] = useState({
    email: initialEmail,
    otp: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setMessage("");
  };

  const handleResend = async () => {
    if (!canResend || !form.email) return;
    setError("");
    setMessage("");
    try {
      await apiRequest("/auth/forgot-password", "POST", { email: form.email });
      setCanResend(false);
      setTimer(30);
      setMessage("OTP resent successfully.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!/^[0-9]{6}$/.test(form.otp)) return setError("OTP must be exactly 6 digits.");
    if (!passwordRegex.test(form.password)) {
      return setError("Use 8+ chars with upper, lower, number, and symbol.");
    }
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");

    setIsLoading(true);
    try {
      await apiRequest("/auth/verify-otp", "POST", {
        email: form.email,
        otp: form.otp,
        password: form.password
      });
      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      badge="OTP Verification"
      title="Complete account recovery securely."
      description="Submit your one-time code and set a new password to restore access."
      imageUrl="https://images.unsplash.com/photo-1496096265110-f83ad7f96608?auto=format&fit=crop&w=1600&q=80"
      highlights={[
        "Time-bound OTP validation for stronger security",
        "Password policy enforcement before update",
        "Resend support with safe cooldown control"
      ]}
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Reset with OTP</h2>
        <p className="text-sm font-medium text-slate-500">
          Use the code sent to your email and set your new password.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="otp"
              className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500"
            >
              One-Time Password
            </label>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                canResend ? "text-emerald-700 hover:text-emerald-800" : "text-slate-300"
              }`}
            >
              <RefreshCw size={11} className={!canResend ? "animate-spin" : ""} />
              {canResend ? "Resend OTP" : `${timer}s`}
            </button>
          </div>
          <div
            className={`group flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition-all ${
              error.toLowerCase().includes("otp")
                ? "border-rose-300 ring-4 ring-rose-100/80"
                : "border-slate-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100"
            }`}
          >
            <KeyRound
              size={18}
              className={
                error.toLowerCase().includes("otp")
                  ? "text-rose-500"
                  : "text-slate-400 group-focus-within:text-emerald-600"
              }
            />
            <input
              id="otp"
              name="otp"
              value={form.otp}
              onChange={handleChange}
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="w-full bg-transparent text-sm font-semibold tracking-[0.2em] text-slate-900 placeholder:tracking-normal placeholder:text-slate-300 outline-none"
            />
          </div>
        </div>

        <AuthField
          label="New Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          icon={Lock}
          autoComplete="new-password"
        />

        <AuthField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter password"
          icon={Lock}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Updating..." : "Update Password"}
          {!isLoading ? <ArrowRight size={16} /> : null}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-emerald-700"
        >
          <ArrowLeft size={14} />
          Back to login
        </button>
      </div>
    </PublicAuthLayout>
  );
}
