import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react";
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
      <label htmlFor={name} className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>

      <div
        className={`group flex items-center gap-2.5 rounded-md border px-3 py-2.5 transition-all ${
          error
            ? "border-rose-300 bg-rose-50/90"
            : "border-slate-200 bg-white shadow-sm hover:border-slate-300 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100"
        }`}
      >
        <Icon
          size={16}
          className={error ? "text-rose-500" : "text-slate-400 transition-colors group-focus-within:text-teal-700"}
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
          className="w-full bg-transparent text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
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

  const changeMode = (nextMode, routeState) => {
    setLoginErrors({});
    setRegisterErrors({});
    if (nextMode === "register") {
      setMessage("");
    }
    onSwitchMode(nextMode, routeState);
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

  const title = mode === "register" ? "Create your account" : "Welcome back";
  const description =
    mode === "register"
      ? "Create a secure account and start generating schema-aware SQL."
      : "Log in to continue generating, saving, and reviewing SQL.";

  return (
    <Modal isOpen={Boolean(mode)} onClose={onClose} className="max-w-4xl rounded-lg">
      <div className="grid bg-white md:grid-cols-[0.86fr_1.14fr]">
        <aside className="hidden bg-[#10232d] p-6 text-white md:flex md:flex-col md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-white/12 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200">
              <Sparkles size={12} />
              AI SQL Studio
            </div>
            <h2 className="display-font mt-5 text-2xl font-bold leading-tight tracking-tight">
              Secure access for a serious SQL workspace.
            </h2>
            <p className="mt-3 text-[13px] font-medium leading-6 text-slate-200">
              Sign in to manage schema context, generate cleaner SQL, and keep every query history available when you need it.
            </p>
          </div>

          <div className="mt-6 rounded-md border border-white/12 bg-white/8 p-3">
            <div className="mb-2.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300">
              <span>Workspace</span>
              <span>Protected</span>
            </div>
            <pre className="mono-font overflow-x-auto text-[10px] leading-5 text-slate-100">
{`SELECT users.name, plans.title
FROM users
JOIN plans ON plans.id = users.plan_id
WHERE users.status = 'active';`}
            </pre>
          </div>
        </aside>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-5 flex flex-col gap-3 pr-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-100 bg-teal-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700 md:hidden">
                <Sparkles size={12} />
                AI SQL Studio
              </div>
              <h2 className="display-font text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {title}
              </h2>
              <p className="mt-1.5 text-[13px] font-medium leading-6 text-slate-500">{description}</p>
            </div>

            <div className="inline-flex w-fit rounded-md border border-slate-200 bg-slate-100 p-1">
              {[
                ["login", "Login"],
                ["register", "Register"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeMode(value)}
                  className={`rounded px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all ${
                    mode === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        {message && mode === "login" ? (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {mode === "login" ? (
            <motion.div key="login" variants={panelMotion} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-2">
                <h3 className="display-font text-xl font-bold tracking-tight text-slate-950">Sign in</h3>
                <p className="text-[13px] font-medium leading-6 text-slate-500">
                  Continue to your SQL dashboard.
                </p>
              </div>

              {loginErrors.server ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-700">
                  {loginErrors.server}
                </div>
              ) : null}

              <form onSubmit={submitLogin} className="mt-4 space-y-3.5">
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
                      className="text-slate-400 transition-colors hover:text-teal-700"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between gap-4">
                  <p className="text-[12px] font-semibold text-slate-500">Small, fast, and focused.</p>
                  <button
                    type="button"
                    onClick={() => changeMode("forgot", { email: loginForm.email.trim() })}
                    className="text-[11px] font-bold uppercase tracking-[0.1em] text-teal-700 transition-colors hover:text-teal-800"
                  >
                    Forgot Password
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                  {!isSubmitting ? <ArrowRight size={15} /> : null}
                </button>
              </form>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = GOOGLE_AUTH_URL;
                  }}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <FcGoogle className="h-5 w-5" />
                  Continue with Google
                </button>

              <p className="mt-4 text-center text-[13px] font-semibold text-slate-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => changeMode("register")}
                  className="font-bold text-teal-700 transition-colors hover:text-teal-800"
                >
                  Register
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.div key="register" variants={panelMotion} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-2">
                <h3 className="display-font text-xl font-bold tracking-tight text-slate-950">Create account</h3>
                <p className="text-[13px] font-medium leading-6 text-slate-500">
                  Set up your secure workspace in less than a minute.
                </p>
              </div>

              {registerErrors.server ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-700">
                  {registerErrors.server}
                </div>
              ) : null}

              <form onSubmit={submitRegister} className="mt-4 space-y-3.5">
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

                <div className="grid gap-3.5 sm:grid-cols-2">
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
                        className="text-slate-400 transition-colors hover:text-teal-700"
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
                        className="text-slate-400 transition-colors hover:text-teal-700"
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Creating..." : "Register"}
                  {!isSubmitting ? <ArrowRight size={15} /> : null}
                </button>
              </form>

              <p className="mt-4 text-center text-[13px] font-semibold text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => changeMode("login")}
                  className="font-bold text-teal-700 transition-colors hover:text-teal-800"
                >
                  Login
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
