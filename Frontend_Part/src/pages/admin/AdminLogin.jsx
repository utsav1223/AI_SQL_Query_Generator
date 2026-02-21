import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Moon, ShieldUser, Sun, UserSquare2 } from "lucide-react";
import { AdminAuthContext } from "../../context/AdminAuthContext";
import { ThemeContext } from "../../context/ThemeContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useContext(AdminAuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [form, setForm] = useState({ userId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      setError(err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen px-5 py-8 sm:px-8 ${isDark ? "bg-slate-950" : "bg-slate-100"}`}>
      <div className="mx-auto mb-4 flex w-full max-w-6xl justify-end">
        <button
          type="button"
          onClick={toggleTheme}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${
            isDark
              ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_460px]">
        <section className={`relative overflow-hidden rounded-[2rem] border p-8 sm:p-12 ${isDark ? "border-slate-800 bg-slate-900 text-white" : "border-slate-200 bg-slate-900 text-white"}`}>
          <div className="absolute -right-16 -top-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-emerald-200">
              <ShieldUser size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Admin Console</span>
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
              Secure control layer for platform management.
            </h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-300 sm:text-base">
              Monitor users, plan distribution, invoices, feedback signals, and usage metrics from a single admin dashboard.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { title: "User Admin", value: "Manage users and plans" },
                { title: "Feedback Desk", value: "Review and resolve feedback" },
                { title: "System Stats", value: "Monitor platform usage" }
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">{item.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-6 shadow-2xl sm:p-8 ${isDark ? "border-slate-700 bg-slate-900 text-slate-100 shadow-black/20" : "border-slate-200 bg-white text-slate-900 shadow-black/10"}`}>
          <div className="mb-7">
            <h2 className={`text-3xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>Admin Login</h2>
            <p className={`mt-2 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              Enter admin user ID and password to continue.
            </p>
          </div>

          {error ? (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${isDark ? "border-rose-400/30 bg-rose-500/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className={`block text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`} htmlFor="userId">
                User ID
              </label>
              <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 focus-within:border-emerald-500 focus-within:ring-4 ${isDark ? "border-slate-700 bg-slate-800 focus-within:ring-emerald-500/20" : "border-slate-200 bg-white focus-within:ring-emerald-100"}`}>
                <UserSquare2 size={18} className={isDark ? "text-slate-400" : "text-slate-400"} />
                <input
                  id="userId"
                  name="userId"
                  value={form.userId}
                  onChange={handleChange}
                  placeholder="Enter admin user ID"
                  className={`w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-500 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`block text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`} htmlFor="password">
                Password
              </label>
              <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 focus-within:border-emerald-500 focus-within:ring-4 ${isDark ? "border-slate-700 bg-slate-800 focus-within:ring-emerald-500/20" : "border-slate-200 bg-white focus-within:ring-emerald-100"}`}>
                <Lock size={18} className={isDark ? "text-slate-400" : "text-slate-400"} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  className={`w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-500 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={`transition-colors ${isDark ? "text-slate-400 hover:text-emerald-400" : "text-slate-400 hover:text-emerald-600"}`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {loading ? "Signing in..." : "Access Admin Dashboard"}
              {!loading ? <ArrowRight size={15} /> : null}
            </button>
          </form>

          <p className={`mt-6 text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            URL access: type <span className={`font-black ${isDark ? "text-slate-200" : "text-slate-700"}`}>/admin/login</span> directly in the address bar.
          </p>
        </section>
      </div>
    </div>
  );
}
