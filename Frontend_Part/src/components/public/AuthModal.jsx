import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import Modal from "./Modal";

const GOOGLE_AUTH_URL =
  import.meta.env.VITE_GOOGLE_AUTH_URL || "http://localhost:5000/api/auth/google";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const panelMotion = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] }
  }
};

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  type = "text",
  autoComplete,
  autoFocus = false,
  rightSlot
}) {
  return (
    <div className="space-y-2.5">
      <label
        htmlFor={name}
        className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500"
      >
        {label}
      </label>

      <div
        className={`group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
          error
            ? "border-rose-300 bg-rose-50/90"
            : "border-slate-200 bg-white shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] hover:border-slate-300 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100"
        }`}
      >
        <Icon
          size={18}
          className={error ? "text-rose-500" : "text-slate-400 transition-colors group-focus-within:text-sky-600"}
        />
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
        />
        {rightSlot}
      </div>

      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

export default function AuthModal({ mode, onClose, onSwitchMode }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changeLogin = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
    setLoginErrors((current) => ({ ...current, [name]: "", server: "" }));
  };

  const changeRegister = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
    setRegisterErrors((current) => ({ ...current, [name]: "", server: "" }));
  };

  const changeMode = (nextMode) => {
    setLoginErrors({});
    setRegisterErrors({});
    if (nextMode === "register") {
      setMessage("");
    }
    onSwitchMode(nextMode);
  };

  const validateLogin = () => {
    const next = {};
    if (!emailRegex.test(loginForm.email)) next.email = "Enter a valid email address.";
    if (!loginForm.password || loginForm.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setLoginErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRegister = () => {
    const next = {};
    if (!registerForm.name.trim() || registerForm.name.trim().length < 3) {
      next.name = "Name must be at least 3 characters.";
    }
    if (!emailRegex.test(registerForm.email)) next.email = "Enter a valid email address.";
    if (!passwordRegex.test(registerForm.password)) {
      next.password = "Use upper, lower, number, symbol, and 8+ characters.";
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setRegisterErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    if (!validateLogin()) return;

    setIsSubmitting(true);
    try {
      const data = await authService.login(loginForm);
      await login(data);
      onClose();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setLoginErrors({
        server: error.errors?.join(", ") || error.message || "Login failed. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    if (!validateRegister()) return;

    setIsSubmitting(true);
    try {
      await authService.register({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password
      });
      setRegisterForm({ name: "", email: "", password: "", confirmPassword: "" });
      setLoginForm((current) => ({ ...current, email: registerForm.email.trim(), password: "" }));
      setRegisterErrors({});
      setMessage("Account created successfully. Please log in to continue.");
      onSwitchMode("login");
    } catch (error) {
      setRegisterErrors({
        server: error.errors?.join(", ") || error.message || "Registration failed. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    mode === "register"
      ? "Create your workspace and start shipping cleaner SQL flows."
      : "Access your dashboard with a faster, cleaner auth flow.";

  return (
    <Modal isOpen={Boolean(mode)} onClose={onClose}>
      <div className="relative overflow-hidden bg-slate-950 px-6 pb-9 pt-8 text-white sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_24%),linear-gradient(160deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-100">
            <Sparkles size={14} />
            AI SQL Studio
          </div>

          <h2 className="display-font mt-6 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
            {title}
          </h2>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {["Schema-aware SQL generation", "Billing, history, and support ready"].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-slate-100"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
                  <ShieldCheck size={16} />
                </span>
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,0.98)_100%)] px-6 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
          {[
            ["login", "Login"],
            ["register", "Register"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeMode(value)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] transition-all ${
                mode === value
                  ? "bg-white text-slate-950 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.4)]"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {message && mode === "login" ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {mode === "login" ? (
            <motion.div key="login" variants={panelMotion} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-2">
                <h3 className="display-font text-3xl font-extrabold tracking-tight text-slate-950">Welcome back</h3>
                <p className="text-sm font-medium leading-7 text-slate-500">
                  Log in to continue working inside your SQL dashboard.
                </p>
              </div>

              {loginErrors.server ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {loginErrors.server}
                </div>
              ) : null}

              <form onSubmit={submitLogin} className="mt-6 space-y-5">
                <Field
                  label="Email"
                  name="email"
                  value={loginForm.email}
                  onChange={changeLogin}
                  placeholder="name@company.com"
                  error={loginErrors.email}
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  autoFocus
                />
                <Field
                  label="Password"
                  name="password"
                  value={loginForm.password}
                  onChange={changeLogin}
                  placeholder="Enter your password"
                  error={loginErrors.password}
                  icon={Lock}
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((current) => !current)}
                      className="text-slate-400 transition-colors hover:text-sky-600"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold text-slate-500">Soft validation, clear focus states, zero clutter.</p>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600 transition-colors hover:text-sky-700"
                  >
                    Forgot Password
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                  {!isSubmitting ? <ArrowRight size={16} /> : null}
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
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <FcGoogle className="h-5 w-5" />
                Continue with Google
              </button>

              <p className="mt-7 text-center text-sm font-semibold text-slate-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => changeMode("register")}
                  className="font-bold text-sky-600 transition-colors hover:text-sky-700"
                >
                  Register
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.div key="register" variants={panelMotion} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-2">
                <h3 className="display-font text-3xl font-extrabold tracking-tight text-slate-950">Create account</h3>
                <p className="text-sm font-medium leading-7 text-slate-500">
                  A simple onboarding flow that still looks product-ready.
                </p>
              </div>

              {registerErrors.server ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {registerErrors.server}
                </div>
              ) : null}

              <form onSubmit={submitRegister} className="mt-6 space-y-5">
                <Field
                  label="Name"
                  name="name"
                  value={registerForm.name}
                  onChange={changeRegister}
                  placeholder="Your full name"
                  error={registerErrors.name}
                  icon={User}
                  autoComplete="name"
                  autoFocus
                />
                <Field
                  label="Email"
                  name="email"
                  value={registerForm.email}
                  onChange={changeRegister}
                  placeholder="name@company.com"
                  error={registerErrors.email}
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Password"
                    name="password"
                    value={registerForm.password}
                    onChange={changeRegister}
                    placeholder="Create password"
                    error={registerErrors.password}
                    icon={Lock}
                    type={showRegisterPassword ? "text" : "password"}
                    autoComplete="new-password"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((current) => !current)}
                        className="text-slate-400 transition-colors hover:text-sky-600"
                        aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                      >
                        {showRegisterPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    }
                  />
                  <Field
                    label="Confirm Password"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={changeRegister}
                    placeholder="Confirm password"
                    error={registerErrors.confirmPassword}
                    icon={Lock}
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="text-slate-400 transition-colors hover:text-sky-600"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Creating..." : "Register"}
                  {!isSubmitting ? <ArrowRight size={16} /> : null}
                </button>
              </form>

              <p className="mt-7 text-center text-sm font-semibold text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => changeMode("login")}
                  className="font-bold text-sky-600 transition-colors hover:text-sky-700"
                >
                  Login
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
