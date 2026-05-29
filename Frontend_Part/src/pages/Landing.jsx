import { useEffect, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  Gauge,
  History,
  Layers3,
  LifeBuoy,
  Menu,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  X,
  Zap
} from "lucide-react";
import AuthModal from "../components/public/AuthModal";
import { PRICING_PLANS } from "../config/productConfig";
import { useAuth } from "../hooks/useAuth";
import RouteLoadingScreen from "../components/ui/RouteLoadingScreen";

const navItems = [
  { label: "Home", sectionId: null },
  { label: "Workspace", sectionId: "workspace" },
  { label: "Features", sectionId: "features" },
  { label: "Pricing", sectionId: "pricing" },
  { label: "FAQ", sectionId: "faq" }
];

const heroStats = [
  { label: "AI modes", value: "6+" },
  { label: "Plans", value: "Free, Pro, Team" },
  { label: "Workflow", value: "Prompt to SQL" }
];

const workspaceModules = [
  {
    title: "Text to SQL",
    description: "Write what you need in plain English and generate readable SQL for real reporting and product work.",
    icon: Sparkles,
    tone: "teal"
  },
  {
    title: "Optimize",
    description: "Improve joins, filters, and query shape so SQL is cleaner before it reaches your database.",
    icon: Zap,
    tone: "amber"
  },
  {
    title: "Validate",
    description: "Review generated SQL for syntax and structure issues before saving or sharing it.",
    icon: ShieldCheck,
    tone: "emerald"
  },
  {
    title: "Explain",
    description: "Turn complicated SQL into plain language so teams can understand what a query does.",
    icon: FileText,
    tone: "sky"
  },
  {
    title: "Format",
    description: "Clean up SQL into a consistent structure that is easier to read, review, and maintain.",
    icon: Code2,
    tone: "slate"
  },
  {
    title: "Schema Context",
    description: "Save tables, columns, and relationships so generations stay grounded in your workspace.",
    icon: Layers3,
    tone: "violet"
  }
];

const featureCards = [
  {
    title: "Workspace overview",
    description: "Users see plan, credits, recent activity, notifications, and their fastest next action from one dashboard.",
    icon: Gauge
  },
  {
    title: "Saved history",
    description: "Generated SQL stays searchable with pins, favorites, tags, copy tracking, and export actions.",
    icon: History
  },
  {
    title: "Analytics",
    description: "Track usage patterns, time saved, query quality, tool mix, and schema-driven activity.",
    icon: BarChart3
  },
  {
    title: "Notifications",
    description: "Important product updates, maintenance notes, and account messages appear directly in the dashboard.",
    icon: Bell
  },
  {
    title: "Billing and invoices",
    description: "Plans, payment verification, billing state, and invoice history are included in the user experience.",
    icon: ReceiptText
  },
  {
    title: "Support and feedback",
    description: "Users can submit feedback, contact support, and review common questions without leaving the dashboard.",
    icon: LifeBuoy
  }
];

const faqItems = [
  {
    question: "What does AI SQL Studio generate?",
    answer: "It generates SQL from prompts and can also optimize, validate, explain, format, and create schema-related output."
  },
  {
    question: "Can users save schema context?",
    answer: "Yes. Users can save schema details so the AI has table and column context when creating SQL."
  },
  {
    question: "Can I receive product updates inside the dashboard?",
    answer: "Yes. Important announcements, account notices, and product updates can appear in the notification section."
  },
  {
    question: "Is billing included?",
    answer: "Yes. The product includes plan pages, payment verification, invoice history, and plan-aware feature access."
  }
];

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Workspace", sectionId: "workspace" },
      { label: "Features", sectionId: "features" },
      { label: "Pricing", sectionId: "pricing" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", sectionId: "faq" }
    ]
  },
  {
    title: "Account",
    links: [
      { label: "Login", mode: "login" },
      { label: "Register", mode: "register" },
      { label: "Developers", path: "/developers" }
    ]
  }
];

const revealViewport = { once: false, amount: 0.14 };
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
};
const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } }
};

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { user, loading: appAuthLoading, loggingOut, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const authMode =
    location.pathname === "/login"
      ? "login"
      : location.pathname === "/register"
        ? "register"
        : null;

  useEffect(() => {
    if (authMode && clerkLoaded && (user || isSignedIn)) {
      navigate("/dashboard", { replace: true });
    }
  }, [authMode, clerkLoaded, isSignedIn, navigate, user]);

  const shouldShowAccountSync =
    authMode && clerkLoaded && isSignedIn && !appAuthLoading && !loggingOut && !user;

  const openAuthModal = (mode) => {
    setMobileMenuOpen(false);
    navigate(mode === "register" ? "/register" : "/login");
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

  const handleFooterLink = (item) => {
    if (item.mode) {
      openAuthModal(item.mode);
      return;
    }

    if (item.path) {
      setMobileMenuOpen(false);
      navigate(item.path);
      return;
    }

    scrollToSection(item.sectionId);
  };

  const switchAuthMode = (mode, routeState) => {
    navigate(mode === "register" ? "/register" : "/login", { replace: true, state: routeState });
  };

  if (authMode && appAuthLoading) {
    return <RouteLoadingScreen label="Syncing your account..." />;
  }

  return (
    <div className="public-page bg-[#f6f8fb] pt-[60px] text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[60px] w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10232d] text-teal-300">
              <Database size={16} />
            </span>
            <div className="min-w-0">
              <p className="display-font text-[12px] font-extrabold uppercase tracking-[0.18em] text-slate-950">
                AI SQL Studio
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Query workspace
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex">
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

          <div className="hidden items-center gap-3 xl:flex">
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 xl:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={scrollToSection}
        onAuth={openAuthModal}
      />

      <main>
        <Hero onAuth={openAuthModal} onExplore={() => scrollToSection("workspace")} />
        <WorkspaceSection />
        <FeaturesSection />
        <PricingSection onAuth={openAuthModal} />
        <FAQSection />
        <ContactSection onAuth={openAuthModal} onPricing={() => scrollToSection("pricing")} />
      </main>

      <Footer onLink={handleFooterLink} />

      {shouldShowAccountSync ? (
        <AccountSyncNotice onSignOut={logout} />
      ) : authMode === "login" || authMode === "register" ? (
        <AuthModal mode={authMode} onClose={closeAuthModal} onSwitchMode={switchAuthMode} />
      ) : null}
    </div>
  );
}

function MobileMenu({ isOpen, onClose, onNavigate, onAuth }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[120] xl:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/45"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-dvh w-[84vw] max-w-[330px] flex-col border-r border-slate-200 bg-white text-slate-950 shadow-2xl"
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
                onClick={onClose}
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
                  onClick={() => onNavigate(item.sectionId)}
                  className="rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto grid gap-2 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => onAuth("login")}
                className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onAuth("register")}
                className="rounded-md bg-[#10232d] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white"
              >
                Register
              </button>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Hero({ onAuth, onExplore }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950">
      <img
        src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2200&q=85"
        alt="Modern data infrastructure"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.34]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.94)_0%,rgba(15,23,42,0.82)_52%,rgba(15,23,42,0.55)_100%)]" />

      <motion.div
        className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:items-center lg:px-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="max-w-2xl" variants={fadeUp}>
          <div className="inline-flex items-center gap-2 rounded-md border border-white/14 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200">
            <Sparkles size={13} />
            AI SQL workspace
          </div>

          <h1 className="display-font mt-5 text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-[64px]">
            AI SQL Studio
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-200 sm:text-base">
            Generate, optimize, validate, explain, format, and manage SQL from a professional SaaS workspace with schema context, history, analytics, billing, notifications, and support.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => onAuth("register")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-400 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-950 transition-all hover:bg-teal-300"
            >
              Start Free
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={onExplore}
              className="inline-flex items-center justify-center rounded-md border border-white/18 bg-white/10 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-white/16"
            >
              View Platform
            </button>
          </div>

          <div className="mt-7 grid gap-2.5 sm:grid-cols-3">
            {heroStats.map((item) => (
              <div key={item.label} className="rounded-md border border-white/12 bg-white/10 p-3 backdrop-blur">
                <p className="display-font text-xl font-bold text-white">{item.value}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="hidden rounded-lg border border-white/14 bg-white/95 p-3 shadow-2xl md:block" variants={fadeUp}>
          <ProductPreview />
        </motion.div>
      </motion.div>
    </section>
  );
}

function ProductPreview() {
  return (
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
        <pre className="mono-font whitespace-pre-wrap break-words p-3 text-[11px] leading-5 text-slate-200">
{`SELECT plan,
       COUNT(user_id) AS active_users,
       SUM(amount) AS monthly_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY plan
ORDER BY monthly_revenue DESC;`}
        </pre>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {["Saved", "Validated", "Exportable"].map((item) => (
          <span key={item} className="rounded-md border border-slate-200 bg-white px-2 py-2 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkspaceSection() {
  return (
    <motion.section
      id="workspace"
      className="px-4 py-12 sm:px-6 lg:px-8"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="Workspace"
          title="All SQL tools in one focused product surface."
          description="AI SQL Studio is designed around practical database work: prompt, generate, review, save, search, and continue."
        />

        <motion.div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={stagger}>
          {workspaceModules.map((item) => (
            <motion.article key={item.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-md" variants={cardReveal}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass(item.tone)}`}>
                <item.icon size={17} />
              </div>
              <h3 className="display-font mt-4 text-base font-bold tracking-tight text-slate-950">{item.title}</h3>
              <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600">{item.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function FeaturesSection() {
  return (
    <motion.section
      id="features"
      className="border-y border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="User dashboard"
          title="A complete frontend experience for day-to-day SQL work."
          description="Users get a responsive dashboard with usage, plan status, recent work, messages, schema tools, analytics, billing, support, and feedback."
        />

        <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" variants={stagger}>
          {featureCards.map((item) => (
            <motion.article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-1 hover:border-teal-200 hover:bg-white hover:shadow-md" variants={cardReveal}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#10232d] text-teal-300">
                  <item.icon size={17} />
                </span>
                <div>
                  <h3 className="display-font text-base font-bold tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function PricingSection({ onAuth }) {
  return (
    <motion.section
      id="pricing"
      className="px-4 py-12 sm:px-6 lg:px-8"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          centered
          eyebrow="Pricing"
          title="Start free, then unlock the serious SQL workflow."
          description="Choose a plan that fits your work: testing, professional solo use, or shared team context."
        />

        <motion.div className="grid gap-5 lg:grid-cols-3" variants={stagger}>
          {PRICING_PLANS.map((plan) => (
            <motion.article
              key={plan.name}
              variants={cardReveal}
              className={`relative flex min-h-[520px] flex-col overflow-hidden rounded-lg border p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                plan.highlighted ? "border-[#10232d] bg-white text-slate-950 ring-1 ring-[#10232d]" : "border-slate-200 bg-white text-slate-950"
              }`}
            >
              {plan.highlighted ? <div className="absolute inset-x-0 top-0 h-1 bg-teal-500" /> : null}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700">
                    {plan.badge}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="display-font text-3xl font-bold tracking-tight sm:text-4xl">{plan.price}</p>
                    <span className="pb-1 text-xs font-semibold text-slate-500">{plan.note}</span>
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

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {plan.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600"
                  >
                    {metric}
                  </span>
                ))}
              </div>

              <div className="my-6 h-px bg-slate-200" />

              <div className="space-y-3">
                {plan.features.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        item.included ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-300"
                      }`}
                    >
                      {item.included ? <CheckCircle2 size={14} /> : <X size={13} />}
                    </span>
                    <span className={`text-[13px] font-semibold ${item.included ? "text-slate-700" : "text-slate-400"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onAuth(plan.mode)}
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
  );
}

function FAQSection() {
  return (
    <motion.section
      id="faq"
      className="border-y border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <div className="mx-auto w-full max-w-5xl">
        <SectionHeading
          centered
          eyebrow="FAQ"
          title="Clear answers for the first visit."
          description="A quick view of what the product includes before someone creates an account."
        />

        <motion.div className="grid gap-4 md:grid-cols-2" variants={stagger}>
          {faqItems.map((item) => (
            <motion.article key={item.question} className="rounded-lg border border-slate-200 bg-slate-50 p-4" variants={cardReveal}>
              <h3 className="display-font text-base font-bold tracking-tight text-slate-950">{item.question}</h3>
              <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600">{item.answer}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function ContactSection({ onAuth, onPricing }) {
  return (
    <motion.section
      id="contact"
      className="px-4 py-12 sm:px-6 lg:px-8"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div className="mx-auto grid w-full max-w-6xl gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" variants={fadeUp}>
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Get started</p>
          <h2 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Launch a sharper SQL workflow today.
          </h2>
          <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
            Create an account, add schema context, generate your first query, and use the dashboard to keep the work organized.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <button
            type="button"
            onClick={() => onAuth("register")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#10232d] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white hover:bg-teal-700"
          >
            Create Account
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={onPricing}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
          >
            Compare Plans
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
}

function Footer({ onLink }) {
  return (
    <footer className="border-t border-slate-200 bg-[#10232d] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.7fr))]">
        <div className="max-w-md">
          <div className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-300 text-slate-950">
              <Database size={17} />
            </span>
            <div>
              <p className="display-font text-[12px] font-extrabold uppercase tracking-[0.18em]">
                AI SQL Studio
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-300">
                Query workspace
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-300">
            Generate, optimize, explain, and manage SQL from a polished SaaS workspace with schema context, billing, notifications, and support tools.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-200">{group.title}</p>
            <div className="mt-4 grid gap-3">
              {group.links.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onLink(item)}
                  className="w-fit text-left text-sm font-semibold text-slate-300 transition-colors hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-3 border-t border-white/10 pt-5 text-[12px] font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright 2026 AI SQL Studio. All rights reserved.</p>
        <p>Built for faster, clearer database work.</p>
      </div>
    </footer>
  );
}

function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <motion.div className={`mb-8 ${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`} variants={fadeUp}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>
      <h2 className="display-font mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className={`mt-3 text-sm font-medium leading-7 text-slate-600 ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
        {description}
      </p>
    </motion.div>
  );
}

function toneClass(tone) {
  if (tone === "amber") return "bg-amber-50 text-amber-700";
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700";
  if (tone === "sky") return "bg-sky-50 text-sky-700";
  if (tone === "violet") return "bg-violet-50 text-violet-700";
  if (tone === "slate") return "bg-slate-100 text-slate-700";
  return "bg-teal-50 text-teal-700";
}

function AccountSyncNotice({ onSignOut }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <ShieldCheck size={23} />
        </div>
        <h2 className="display-font mt-4 text-xl font-bold tracking-tight text-slate-950">
          Finishing account setup
        </h2>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
          Your Clerk session is active, but the workspace profile did not load yet. Refresh once after the backend is running, or sign out and sign in again.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-[#10232d] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white hover:bg-teal-700"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
