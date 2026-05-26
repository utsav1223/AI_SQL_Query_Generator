import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  Layers3,
  Menu,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  X,
  Zap
} from "lucide-react";
import AuthModal from "../components/public/AuthModal";
import ForgotPasswordModal from "../components/public/ForgotPasswordModal";
import ResetPasswordModal from "../components/public/ResetPasswordModal";
import { developers } from "../data/developers";

const navItems = [
  { label: "Home", sectionId: null },
  { label: "Features", sectionId: "features" },
  { label: "Pricing", sectionId: "pricing" },
  { label: "Team", sectionId: "team" },
  { label: "Contact", sectionId: "contact" }
];

const featureCards = [
  {
    title: "Ask in plain English",
    description: "Describe the result you need and get readable SQL that respects your tables, joins, and filters.",
    icon: Sparkles
  },
  {
    title: "Keep schema context",
    description: "Save database structure once, then reuse it across generations so output is more accurate.",
    icon: Database
  },
  {
    title: "Review before shipping",
    description: "Use history, validation, and clear query output to move from draft to confident execution.",
    icon: BarChart3
  },
  {
    title: "Built like a SaaS product",
    description: "Authentication, billing, support, settings, and usage flows live in one polished experience.",
    icon: ShieldCheck
  }
];

const workflowSteps = [
  { title: "Connect context", description: "Add the tables, columns, and relationships your SQL depends on.", icon: Layers3 },
  { title: "Write the request", description: "Explain the report, dashboard, or backend query in natural language.", icon: BrainCircuit },
  { title: "Refine the result", description: "Review the generated SQL, save the query, and continue from history.", icon: FileText }
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For students, prototypes, and personal projects.",
    features: ["AI query generation", "Schema workspace", "Saved history"],
    action: "Start Free",
    mode: "register"
  },
  {
    name: "Pro",
    price: "INR 499",
    description: "For serious usage with billing, support, and stronger workflow tools.",
    features: ["Unlimited generations", "Validation and explain tools", "Invoices and plan management"],
    action: "Go Pro",
    mode: "login",
    highlighted: true
  }
];

const stats = [
  { label: "Setup", value: "5 min" },
  { label: "Workspace", value: "Full SaaS" },
  { label: "Flow", value: "Prompt to SQL" }
];

const developersPreview = developers.slice(0, 3);

const revealViewport = { once: false, amount: 0.18 };
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};
const cardReveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
};

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const authMode =
    location.pathname === "/login"
      ? "login"
      : location.pathname === "/register"
        ? "register"
        : location.pathname === "/forgot-password"
          ? "forgot"
          : location.pathname === "/reset-with-otp"
            ? "reset"
            : null;

  const recoveryEmail = location.state?.email || "";

  const openAuthModal = (mode) => {
    setMobileMenuOpen(false);
    navigate(
      mode === "register"
        ? "/register"
        : mode === "forgot"
          ? "/forgot-password"
          : mode === "reset"
            ? "/reset-with-otp"
            : "/login"
    );
  };

  const closeAuthModal = () => {
    setMobileMenuOpen(false);
    navigate("/", { replace: true });
  };

  const scrollToSection = (sectionId) => {
    const performScroll = () => {
      if (!sectionId) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    setMobileMenuOpen(false);

    if (location.pathname !== "/" || authMode) {
      navigate("/", { replace: Boolean(authMode) });
      window.setTimeout(performScroll, 80);
      return;
    }

    performScroll();
  };

  const switchAuthMode = (mode, routeState) => {
    const nextPath =
      mode === "register"
        ? "/register"
        : mode === "forgot"
          ? "/forgot-password"
          : mode === "reset"
            ? "/reset-with-otp"
            : "/login";

    navigate(nextPath, { replace: true, state: routeState });
  };

  return (
    <div className="public-page bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10232d] text-teal-300">
              <Database size={16} />
            </span>
            <div>
              <p className="display-font text-[12px] font-extrabold uppercase tracking-[0.18em] text-slate-950">
                AI SQL Studio
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Query workspace
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-slate-950"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className="inline-flex items-center gap-2 rounded-md bg-[#10232d] px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-teal-700"
            >
              Register
              <ArrowRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

      </header>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            className="fixed inset-0 z-[120] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/45"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-dvh w-[84vw] max-w-[320px] flex-col border-r border-slate-200 bg-white text-slate-950 shadow-2xl"
            >
              <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200 px-4">
                <div className="inline-flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10232d] text-teal-300">
                    <Database size={16} />
                  </span>
                  <span className="truncate text-[12px] font-extrabold uppercase tracking-[0.14em] text-slate-950">
                    AI SQL Studio
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>

              <nav className="grid gap-1 p-3">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollToSection(item.sectionId)}
                    className="rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-auto grid gap-2 border-t border-slate-200 p-4">
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="rounded-md bg-[#10232d] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white"
                >
                  Register
                </button>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950">
          <img
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2200&q=85"
            alt="Modern data center"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.34]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.93)_0%,rgba(15,23,42,0.82)_48%,rgba(15,23,42,0.52)_100%)]" />

          <motion.div
            className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1fr_420px] lg:items-center lg:px-8"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="max-w-2xl" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-md border border-white/14 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200">
                <Zap size={13} />
                AI assisted SQL generation
              </div>

              <h1 className="display-font mt-5 text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[56px]">
                Turn database questions into production-ready SQL.
              </h1>

              <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-200 sm:text-base">
                A polished workspace for writing prompts, managing schema context, reviewing generated SQL, and moving faster without losing control.
              </p>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-400 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-950 transition-all hover:bg-teal-300"
                >
                  Get Started
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("features")}
                  className="inline-flex items-center justify-center rounded-md border border-white/18 bg-white/10 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-white/16"
                >
                  Explore Features
                </button>
              </div>

              <div className="mt-8 grid gap-2.5 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-md border border-white/12 bg-white/10 p-3 backdrop-blur">
                    <p className="display-font text-xl font-bold text-white">{item.value}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="rounded-lg border border-white/14 bg-white/95 p-3 shadow-2xl" variants={fadeUp}>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700">
                      Workspace Preview
                    </p>
                    <h2 className="display-font mt-1 text-xl font-bold tracking-tight text-slate-950">
                      Revenue query
                    </h2>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    Ready
                  </span>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Prompt</p>
                  <p className="mt-2 text-[13px] font-semibold leading-6 text-slate-700">
                    Show active subscriptions by plan with monthly recurring revenue.
                  </p>
                </div>

                <div className="mt-3 overflow-hidden rounded-md border border-slate-800 bg-slate-950">
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    <span>Generated SQL</span>
                    <span>Schema aware</span>
                  </div>
                  <pre className="mono-font overflow-x-auto p-3 text-[11px] leading-5 text-slate-200">
{`SELECT plan,
       COUNT(user_id) AS active_users,
       SUM(amount) AS monthly_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY plan
ORDER BY monthly_revenue DESC;`}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <motion.section
          id="features"
          className="px-4 py-12 sm:px-6 lg:px-8"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          <div className="mx-auto w-full max-w-7xl">
            <motion.div className="mb-8 max-w-2xl" variants={fadeUp}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Features</p>
              <h2 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Everything needed to go from schema to usable SQL.
              </h2>
            </motion.div>

            <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" variants={stagger}>
              {featureCards.map((item) => (
                <motion.article key={item.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-md" variants={cardReveal}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#10232d] text-teal-300">
                    <item.icon size={16} />
                  </div>
                  <h3 className="display-font mt-4 text-base font-bold tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600">{item.description}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="border-y border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          <div className="mx-auto grid w-full max-w-7xl gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <motion.div variants={fadeUp}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Workflow</p>
              <h2 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                A focused path from idea to query.
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                The interface keeps the important decisions visible: what schema is being used, what was requested, and what SQL is ready to run.
              </p>
            </motion.div>

            <motion.div className="grid gap-4 md:grid-cols-3" variants={stagger}>
              {workflowSteps.map((step, index) => (
                <motion.article key={step.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-1 hover:border-teal-200 hover:bg-white" variants={cardReveal}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Step {index + 1}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-teal-700">
                      <step.icon size={16} />
                    </span>
                  </div>
                  <h3 className="display-font mt-4 text-base font-bold tracking-tight text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600">{step.description}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="pricing"
          className="px-4 py-12 sm:px-6 lg:px-8"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          <div className="mx-auto w-full max-w-5xl">
            <motion.div className="mb-8 text-center" variants={fadeUp}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Pricing</p>
              <h2 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Clear plans for learning and scaling.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-600">
                Start free, then move into the full workflow when you need more generation, validation, and billing tools.
              </p>
            </motion.div>

            <motion.div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2" variants={stagger}>
              {plans.map((plan) => (
                <motion.article
                  key={plan.name}
                  variants={cardReveal}
                  className={`relative flex min-h-[430px] flex-col overflow-hidden rounded-xl border p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                    plan.highlighted ? "border-[#10232d] bg-white text-slate-950 ring-1 ring-[#10232d]" : "border-slate-200 bg-white text-slate-950"
                  }`}
                >
                  {plan.highlighted ? (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-slate-900 to-teal-500" />
                  ) : null}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700">
                        {plan.name}
                      </p>
                      <div className="mt-2 flex items-end gap-2">
                        <p className="display-font text-3xl font-bold tracking-tight sm:text-4xl">{plan.price}</p>
                        {plan.price !== "Free" ? (
                          <span className="pb-1 text-xs font-semibold text-slate-500">/ month</span>
                        ) : null}
                      </div>
                    </div>
                    {plan.highlighted ? (
                      <span className="rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-teal-800">
                        Best value
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-[13px] font-medium leading-6 text-slate-600">
                    {plan.description}
                  </p>

                  <div className="my-6 h-px bg-slate-200" />

                  <div className="space-y-3">
                    {plan.features.map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                          <CheckCircle2 size={14} />
                        </span>
                        <span className="text-[13px] font-semibold text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => openAuthModal(plan.mode)}
                    className={`mt-auto inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] transition-all ${
                      plan.highlighted ? "bg-[#10232d] text-white hover:bg-teal-700" : "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {plan.action}
                  </button>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="team"
          className="border-y border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          <div className="mx-auto w-full max-w-7xl">
            <motion.div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" variants={fadeUp}>
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Team</p>
                <h2 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Built by the team behind the product.
                </h2>
              </div>
              <Link
                to="/developers"
                className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600 transition-colors hover:text-slate-950"
              >
                Full Team
                <ArrowRight size={14} />
              </Link>
            </motion.div>

            <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" variants={stagger}>
              {developersPreview.map((dev) => (
                <motion.article key={dev.name} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-md" variants={cardReveal}>
                  <img src={dev.image} alt={dev.name} loading="lazy" className="aspect-[16/10] w-full bg-slate-100 object-cover object-center" />
                  <div className="p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700">{dev.role}</p>
                    <h3 className="display-font mt-2 text-base font-bold tracking-tight text-slate-950">{dev.name}</h3>
                    <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600">{dev.shortBio}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="contact"
          className="px-4 py-12 sm:px-6 lg:px-8"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          <motion.div className="mx-auto grid w-full max-w-6xl gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center" variants={fadeUp}>
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Contact</p>
              <h2 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Ready to present a sharper SQL product?
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[13px] font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <MessageSquareMore size={14} className="text-teal-700" />
                  Support-ready dashboard
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <ShieldCheck size={14} className="text-teal-700" />
                  Secure auth flow
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white hover:bg-teal-700"
              >
                Get Started
                <ArrowRight size={14} />
              </button>
              <Link
                to="/developers"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
              >
                Meet The Team
              </Link>
            </div>
          </motion.div>
        </motion.section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-[13px] font-semibold text-slate-500">Copyright 2026 AI SQL Studio</p>
          <div className="flex flex-wrap items-center gap-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500 hover:text-slate-950"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {authMode === "login" || authMode === "register" ? (
        <AuthModal mode={authMode} onClose={closeAuthModal} onSwitchMode={switchAuthMode} />
      ) : null}

      {authMode === "forgot" ? (
        <ForgotPasswordModal
          isOpen
          onClose={closeAuthModal}
          onSwitchMode={switchAuthMode}
          recoveryEmail={recoveryEmail}
        />
      ) : null}

      {authMode === "reset" ? (
        <ResetPasswordModal
          isOpen
          onClose={closeAuthModal}
          onSwitchMode={switchAuthMode}
          recoveryEmail={recoveryEmail}
        />
      ) : null}
    </div>
  );
}
