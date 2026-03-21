import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Moon,
  ShieldUser,
  Sun,
  UserSquare2
} from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [form, setForm] = useState({ userId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.userId.trim() || !form.password.trim()) {
      setError("User ID and password are required.");
      return;
    }

    setLoading(true);

    try {
      await login({
        userId: form.userId.trim(),
        password: form.password
      });
      navigate("/admin/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  const pageClass = isDark ? "bg-slate-950 text-slate-100" : "bg-[#eef1eb] text-slate-950";
  const cardClass = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100"
    : "border-slate-900/8 bg-white/86 text-slate-950";
  const inputClass = isDark
    ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus-within:border-[#8fe1cf] focus-within:ring-[#8fe1cf]/12"
    : "border-slate-900/8 bg-white text-slate-900 placeholder:text-slate-400 focus-within:border-[#0f766e] focus-within:ring-[#0f766e]/10";

  return (
    <div className={`min-h-screen px-4 py-4 sm:px-6 sm:py-6 ${pageClass}`}>
      <div className="mx-auto mb-4 flex w-full max-w-6xl justify-end">
        <button
          type="button"
          onClick={toggleTheme}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] ${
            isDark
              ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600"
              : "border-slate-900/8 bg-white/70 text-slate-700 hover:border-slate-900/16"
          }`}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-[2.2rem] bg-[#112129] p-8 text-white shadow-[0_40px_90px_-48px_rgba(17,33,41,0.98)] sm:p-10">
          <div className="absolute -left-12 top-0 h-44 w-44 rounded-full bg-[#8fe1cf]/18 blur-3xl" />
          <div className="absolute -right-14 bottom-0 h-52 w-52 rounded-full bg-[#c76b2d]/18 blur-3xl" />
          <div className="public-grid absolute inset-0 opacity-15" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8fe1cf]/26 bg-[#8fe1cf]/10 px-4 py-2 text-[#8fe1cf]">
              <ShieldUser size={14} />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">
                Admin Console
              </span>
            </div>

            <h1 className="display-font mt-7 max-w-xl text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
              Secure access for platform control and user oversight.
            </h1>

            <p className="mt-5 max-w-xl text-sm font-medium leading-8 text-slate-300 sm:text-base">
              Review signups, monitor subscriptions, handle feedback, and manage risk signals
              from a cleaner, more professional admin surface.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Users", value: "Manage plans" },
                { title: "Security", value: "Track signals" },
                { title: "Billing", value: "View invoices" }
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.5rem] border border-white/10 bg-white/7 p-4 backdrop-blur-sm"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8fe1cf]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">{item.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`rounded-[2.2rem] border p-6 shadow-[0_28px_80px_-44px_rgba(15,23,42,0.5)] sm:p-8 ${cardClass}`}>
          <div className="mb-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#0f766e] dark:text-[#8fe1cf]">
              Restricted Access
            </p>
            <h2 className="display-font mt-3 text-3xl font-extrabold tracking-tight">
              Admin Login
            </h2>
            <p className={`mt-3 text-sm font-medium leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Enter your admin credentials to continue into the platform control center.
            </p>
          </div>

          {error ? (
            <div
              className={`mb-5 rounded-[1.4rem] border px-4 py-3 text-sm font-semibold ${
                isDark
                  ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FieldShell
              label="User ID"
              icon={<UserSquare2 size={18} className={isDark ? "text-slate-400" : "text-slate-400"} />}
              className={inputClass}
            >
              <input
                id="userId"
                name="userId"
                value={form.userId}
                onChange={handleChange}
                placeholder="Enter admin user ID"
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
            </FieldShell>

            <FieldShell
              label="Password"
              icon={<Lock size={18} className={isDark ? "text-slate-400" : "text-slate-400"} />}
              className={inputClass}
            >
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={`transition-colors ${
                  isDark ? "text-slate-400 hover:text-[#8fe1cf]" : "text-slate-400 hover:text-[#0f766e]"
                }`}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </FieldShell>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#112129] px-5 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Access Admin Dashboard"}
              {!loading ? <ArrowRight size={14} /> : null}
            </button>
          </form>

          <p className={`mt-6 text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Direct route:
            <span className={`ml-2 font-extrabold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              /admin/login
            </span>
          </p>
        </section>
      </div>
    </div>
  );
}

function FieldShell({ label, icon, className, children }) {
  return (
    <div className="space-y-2.5">
      <label
        className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      <div className={`flex items-center gap-3 rounded-[1.35rem] border px-4 py-3.5 ring-4 ring-transparent transition-all focus-within:ring-opacity-100 ${className}`}>
        {icon}
        {children}
      </div>
    </div>
  );
}
