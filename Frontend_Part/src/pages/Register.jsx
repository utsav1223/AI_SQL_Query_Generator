import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { apiRequest } from "../services/api";
import PublicAuthLayout from "../components/public/PublicAuthLayout";
import AuthField from "../components/public/AuthField";

const GOOGLE_AUTH_URL =
  import.meta.env.VITE_GOOGLE_AUTH_URL || "http://localhost:5000/api/auth/google";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name] || errors.server) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[e.target.name];
        delete next.server;
        return next;
      });
    }
  };

  const validate = () => {
    const next = {};
    const nameRegex = /^[A-Za-z ]{3,}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!nameRegex.test(form.name)) next.name = "Name must be at least 3 characters.";
    if (!emailRegex.test(form.email)) next.email = "Enter a valid email address.";
    if (!passwordRegex.test(form.password)) {
      next.password = "Use 8+ characters with upper, lower, number, and symbol.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await apiRequest("/auth/register", "POST", form);
      navigate("/login", { replace: true });
    } catch (err) {
      if (err.errors) setErrors({ server: err.errors.join(", ") });
      else if (err.message) setErrors({ server: err.message });
      else setErrors({ server: "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      badge="Onboarding Pipeline"
      title="Create your SQL workspace in under a minute."
      description="Set up your account and unlock AI-assisted query generation, team history, and billing controls."
      imageUrl="https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1600&q=80"
      highlights={[
        "Structured onboarding for individual users and teams",
        "Secure account layer with token and role-based controls",
        "Scales from prototypes to production workloads"
      ]}
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Create Account</h2>
        <p className="text-sm font-medium text-slate-500">
          Start building faster with AI-powered SQL workflows.
        </p>
      </div>

      {errors.server ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errors.server}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <AuthField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your full name"
          icon={User}
          error={errors.name}
          autoComplete="name"
        />

        <AuthField
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="name@company.com"
          icon={Mail}
          error={errors.email}
          autoComplete="email"
        />

        <AuthField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          icon={Lock}
          error={errors.password}
          autoComplete="new-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-400 transition-colors hover:text-emerald-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Creating..." : "Create Account"}
          {!isLoading ? <ArrowRight size={16} /> : null}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => {
          window.location.href = GOOGLE_AUTH_URL;
        }}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
      >
        <FcGoogle className="h-5 w-5" />
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm font-semibold text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="text-emerald-700 hover:text-emerald-800">
          Sign in
        </Link>
      </p>
    </PublicAuthLayout>
  );
}
