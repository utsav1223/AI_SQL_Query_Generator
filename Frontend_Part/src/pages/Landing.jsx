import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  Menu,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Workflow,
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
  { label: "Contact", sectionId: "contact" }
];

const featureCards = [
  {
    title: "Natural language to SQL",
    description: "Turn plain-English requests into clean SQL without making the UI feel technical or overwhelming.",
    icon: Sparkles
  },
  {
    title: "Schema-aware context",
    description: "Store tables and relationships so the generated output matches your real database structure.",
    icon: Database
  },
  {
    title: "Review workflow",
    description: "Validate, optimize, and inspect queries before moving them into demos, reports, or production.",
    icon: BarChart3
  },
  {
    title: "SaaS-ready surface",
    description: "Auth, pricing, billing, and support all live inside one polished product experience.",
    icon: ShieldCheck
  }
];

const workflowSteps = [
  {
    title: "Add your schema",
    description: "Provide table structure and columns so the app understands your project before generating SQL.",
    icon: Database
  },
  {
    title: "Describe the result",
    description: "Write what you want in plain language instead of hand-crafting complex queries from scratch.",
    icon: BrainCircuit
  },
  {
    title: "Review and ship",
    description: "Check the output, make quick edits, and keep the workflow readable for future updates.",
    icon: Workflow
  }
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Great for student projects, demos, and learning the platform.",
    features: ["Query generation", "Saved history", "Basic schema workspace"],
    action: "Start Free",
    mode: "register"
  },
  {
    name: "Pro",
    price: "INR 499",
    description: "For users who want optimization tools, billing flow, and a stronger SaaS experience.",
    features: ["Unlimited generation", "Validation and explain tools", "Invoices and plan management"],
    action: "Upgrade To Pro",
    mode: "login",
    highlighted: true
  }
];

const stats = [
  { label: "Setup Time", value: "< 5 mins" },
  { label: "Interface", value: "Modern SaaS" },
  { label: "Flow", value: "Schema to SQL" }
];

const signals = [
  "Prompt-based generation",
  "Schema-aware output",
  "History and billing",
  "Support-ready dashboard"
];

const developersPreview = developers.slice(0, 3);

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

      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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
    <div className="public-page relative overflow-hidden text-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute right-[-10%] top-20 h-[25rem] w-[25rem] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-slate-300/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sky-300 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.9)]">
              <Database size={18} />
            </span>
            <div>
              <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em] text-slate-950">
                AI SQL Studio
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Modern query workspace
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 transition-colors hover:text-slate-950"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-sky-600"
            >
              Register
              <ArrowRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-slate-200/80 bg-white/92 px-5 py-4 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => scrollToSection(item.sectionId)}
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-950"
                >
                  {item.label}
                </button>
              ))}
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="rounded-full border border-slate-200 bg-white px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="rounded-full bg-slate-950 px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative pb-20">
        <section className="px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700 shadow-[0_15px_40px_-30px_rgba(14,165,233,0.45)]">
                <Zap size={14} />
                Clean SaaS experience for AI SQL workflows
              </div>

              <h1 className="display-font mt-7 text-5xl font-extrabold leading-[0.94] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
                Generate better SQL with a UI that finally feels modern and professional.
              </h1>

              <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                AI SQL Studio combines natural-language query generation, schema context,
                pricing, and support inside a product experience inspired by real startup
                websites instead of cluttered student dashboards.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white transition-all hover:-translate-y-0.5 hover:bg-sky-600"
                >
                  Get Started
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("features")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-700 transition-all hover:border-slate-300 hover:bg-white"
                >
                  Learn More
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-[1.7rem] border border-white/80 bg-white/80 px-5 py-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)] backdrop-blur-xl"
                  >
                    <p className="display-font text-2xl font-extrabold tracking-tight text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                      {item.label}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_40px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-6">
              <div className="rounded-[1.8rem] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),linear-gradient(155deg,#020617_0%,#0f172a_56%,#111827_100%)] p-5 text-white sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-sky-200">
                      Workspace Preview
                    </p>
                    <h2 className="display-font mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Schema-aware SQL generation
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/85">
                    Live
                  </span>
                </div>

                <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-300">
                    Prompt
                  </p>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-100">
                    Show monthly active subscriptions grouped by plan with total revenue.
                  </p>
                </div>

                <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                    <span>Generated SQL</span>
                    <span>Optimized</span>
                  </div>
                  <pre className="mono-font overflow-x-auto text-[12px] leading-6 text-slate-200">
{`SELECT plan,
       COUNT(user_id) AS active_users,
       SUM(amount) AS monthly_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY plan;`}
                  </pre>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {signals.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.35)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-sky-300">
                      <CheckCircle2 size={16} />
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-5 py-20 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-sky-700">
                Features
              </p>
              <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Better spacing, stronger hierarchy, and cleaner cards across the full journey.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.9rem] border border-white/80 bg-white/82 p-7 shadow-[0_26px_70px_-50px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-1"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-slate-950 text-sky-300">
                    <item.icon size={20} />
                  </div>
                  <h3 className="display-font mt-6 text-2xl font-extrabold tracking-tight text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.9)_100%)] px-6 py-8 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.35)] sm:px-10 sm:py-12">
            <div className="mb-10 max-w-2xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-sky-700">
                Workflow
              </p>
              <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Three simple steps from idea to executable SQL.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <article key={step.title} className="rounded-[1.8rem] border border-slate-200 bg-white/90 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                      Step {index + 1}
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                      <step.icon size={18} />
                    </span>
                  </div>
                  <h3 className="display-font mt-6 text-2xl font-extrabold tracking-tight text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-5 py-20 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-12 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-sky-700">
                Pricing
              </p>
              <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Clear plans with room to scale when the project grows.
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-[2rem] border p-8 ${
                    plan.highlighted
                      ? "border-slate-900/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_24%),linear-gradient(160deg,#020617_0%,#0f172a_60%,#111827_100%)] text-white"
                      : "border-white/80 bg-white/85 text-slate-950"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className={`text-[10px] font-extrabold uppercase tracking-[0.22em] ${plan.highlighted ? "text-sky-200" : "text-slate-500"}`}>
                        {plan.name}
                      </p>
                      <p className="display-font mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
                        {plan.price}
                      </p>
                    </div>
                    {plan.highlighted ? (
                      <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/85">
                        Most Popular
                      </span>
                    ) : null}
                  </div>

                  <p className={`mt-4 text-sm font-medium leading-7 ${plan.highlighted ? "text-slate-300" : "text-slate-600"}`}>
                    {plan.description}
                  </p>

                  <div className="mt-8 space-y-3">
                    {plan.features.map((item) => (
                      <div
                        key={item}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                          plan.highlighted ? "border-white/10 bg-white/6 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <CheckCircle2 size={17} className={plan.highlighted ? "text-sky-200" : "text-sky-700"} />
                        <span className="text-sm font-semibold">{item}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => openAuthModal(plan.mode)}
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] transition-all ${
                      plan.highlighted
                        ? "bg-white text-slate-950 hover:-translate-y-0.5 hover:bg-sky-50"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {plan.action}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="px-5 py-20 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-sky-700">
                  About Us
                </p>
                <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                  The team building the product behind the landing page.
                </h2>
                <p className="mt-4 text-base font-medium leading-8 text-slate-600">
                  These are the developers shaping the frontend, backend, and AI workflow
                  inside AI SQL Studio.
                </p>
              </div>

              <Link
                to="/developers"
                className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:text-slate-950"
              >
                Full Team Page
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {developersPreview.map((dev) => (
                <article
                  key={dev.name}
                  className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/84 shadow-[0_26px_70px_-50px_rgba(15,23,42,0.35)]"
                >
                  <div className="p-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100">
                      <img
                        src={dev.image}
                        alt={dev.name}
                        loading="lazy"
                        className="aspect-[4/5] w-full bg-slate-100 object-contain object-center"
                      />
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-700">
                      {dev.role}
                    </p>
                    <h3 className="display-font mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
                      {dev.name}
                    </h3>
                    <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                      {dev.shortBio}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="px-5 py-20 sm:px-8">
          <div className="mx-auto grid w-full max-w-6xl gap-6 rounded-[2.2rem] border border-white/80 bg-white/84 p-6 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-sky-700">
                Contact
              </p>
              <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Need a sharper first impression for demos, reviews, or internships?
              </h2>
              <p className="mt-4 text-base font-medium leading-8 text-slate-600">
                Start with the polished auth flow, show the pricing surface, and present the whole product like a real startup build.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                  <MessageSquareMore size={15} className="text-sky-700" />
                  Student-friendly code
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                  <ShieldCheck size={15} className="text-sky-700" />
                  Clean auth experience
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-sky-600"
              >
                Get Started
                <ArrowRight size={14} />
              </button>
              <Link
                to="/developers"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                Meet The Team
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/70 bg-white/72 px-5 py-8 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              AI SQL Studio
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Modern SaaS UI for schema-aware SQL generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-950"
              >
                {item.label}
              </button>
            ))}
            <span className="text-sm font-semibold text-slate-400">
              Copyright 2026 AI SQL Studio
            </span>
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
