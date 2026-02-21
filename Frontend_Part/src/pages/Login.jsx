import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import PublicAuthLayout from "../components/public/PublicAuthLayout";
import AuthField from "../components/public/AuthField";

const GOOGLE_AUTH_URL =
  import.meta.env.VITE_GOOGLE_AUTH_URL || "http://localhost:5000/api/auth/google";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.password || form.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await apiRequest("/auth/login", "POST", form);
      await login(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.errors) setErrors({ server: err.errors.join(", ") });
      else if (err.message) setErrors({ server: err.message });
      else setErrors({ server: "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      badge="Secure Workspace Access"
      title="Welcome back to your AI SQL control center."
      description="Log in to continue generating, validating, and tracking production SQL at scale."
      imageUrl="https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1600&q=80"
      highlights={[
        "Enterprise-ready authentication and session controls",
        "Fast query workflow sync across your workspace",
        "Instant access to history, billing, and usage analytics"
      ]}
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Sign In</h2>
        <p className="text-sm font-medium text-slate-500">
          Continue where you left off.
        </p>
      </div>

      {errors.server ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errors.server}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
          placeholder="Enter your password"
          icon={Lock}
          error={errors.password}
          autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 hover:text-emerald-800"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Logging in..." : "Login"}
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
        New here?{" "}
        <Link to="/register" className="text-emerald-700 hover:text-emerald-800">
          Create account
        </Link>
      </p>
    </PublicAuthLayout>
  );
}
