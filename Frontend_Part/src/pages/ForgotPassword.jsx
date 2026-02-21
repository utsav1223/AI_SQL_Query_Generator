import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { apiRequest } from "../services/api";
import PublicAuthLayout from "../components/public/PublicAuthLayout";
import AuthField from "../components/public/AuthField";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: "Enter a valid email address." });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage("");

    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await apiRequest("/auth/forgot-password", "POST", { email });
      setMessage("OTP sent to your email. Redirecting...");
      setTimeout(() => {
        navigate("/reset-with-otp", { state: { email } });
      }, 1200);
    } catch (err) {
      setErrors({ server: err.message || "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      badge="Recovery Protocol"
      title="Reset access without losing your workspace state."
      description="We will send a one-time verification code to your email so you can safely create a new password."
      imageUrl="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80"
      highlights={[
        "One-time verification token for secure account recovery",
        "Automatic transition to OTP reset screen",
        "Minimal downtime for your query workflow"
      ]}
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Forgot Password</h2>
        <p className="text-sm font-medium text-slate-500">
          Enter your account email to receive a verification code.
        </p>
      </div>

      {errors.server ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errors.server}
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <AuthField
          label="Recovery Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email || errors.server) setErrors({});
          }}
          placeholder="name@company.com"
          icon={Mail}
          error={errors.email}
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Sending..." : "Send OTP"}
          {!isLoading ? <ArrowRight size={16} /> : null}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-emerald-700"
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </div>
    </PublicAuthLayout>
  );
}
