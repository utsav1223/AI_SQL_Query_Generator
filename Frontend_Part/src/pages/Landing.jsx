import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  LineChart,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap
} from "lucide-react";
import { developers } from "../data/developers";

const featureCards = [
  {
    title: "Natural Language to SQL",
    desc: "Write prompts in plain English and get production-grade SQL with schema-aware accuracy.",
    icon: Bot
  },
  {
    title: "Instant Query Optimization",
    desc: "Improve execution plans and performance with real-time optimization feedback.",
    icon: LineChart
  },
  {
    title: "Secure Team Workspaces",
    desc: "Role-based access, history tracking, and billing controls for growing teams.",
    icon: ShieldCheck
  }
];

const workflow = [
  {
    title: "Connect Schema",
    desc: "Attach your structure so generated SQL matches your tables and relationships.",
    icon: Database
  },
  {
    title: "Describe Intent",
    desc: "Explain the report or data logic you need using natural language.",
    icon: Sparkles
  },
  {
    title: "Generate and Ship",
    desc: "Review, refine, and export fast SQL output ready for execution.",
    icon: Workflow
  }
];

const faqs = [
  {
    q: "Can I use this for complex SQL joins and analytics?",
    a: "Yes. The generator supports joins, aggregations, filters, CTE patterns, and optimization suggestions."
  },
  {
    q: "Does pricing include query history and billing records?",
    a: "Yes. Paid plans include billing records, usage visibility, and account lifecycle tracking."
  },
  {
    q: "Is there authentication and secure access control?",
    a: "Yes. Accounts use token-based authentication with protected dashboard routes and session validation."
  },
  {
    q: "Can I start free before upgrading?",
    a: "Yes. You can register and explore the platform before moving to a paid billing flow."
  }
];

const developersPreview = developers.slice(0, 3);

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="rounded-xl bg-slate-900 p-2 text-emerald-400">
              <Database size={16} />
            </span>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
              AI SQL Studio
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#features" className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 hover:text-slate-900">
              Features
            </a>
            <a href="#workflow" className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 hover:text-slate-900">
              Workflow
            </a>
            <a href="#pricing" className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 hover:text-slate-900">
              Pricing
            </a>
            <a href="#faq" className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 hover:text-slate-900">
              FAQ
            </a>
            <Link to="/developers" className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 hover:text-slate-900">
              Developers
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 sm:inline-flex"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-emerald-600"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 pb-24 pt-16 sm:px-8 sm:pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-28 top-4 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
          <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(#dbe4ef_1px,transparent_1px)] [background-size:28px_28px] opacity-50" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-emerald-700">
              <Zap size={13} />
              <span className="text-[10px] font-black uppercase tracking-[0.22em]">AI SQL Engine Live</span>
            </div>

            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Build SQL workflows that ship faster and break less.
            </h1>

            <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
              AI SQL Studio gives you a production-focused interface to generate, optimize, and manage SQL with clean visibility across auth, history, billing, and support.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600"
              >
                Start Free
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
              >
                Open Dashboard
              </Link>
              <Link
                to="/developers"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
              >
                Meet Developers
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Query Accuracy", value: "99.9%" },
                { label: "Avg Response", value: "<180ms" },
                { label: "Team Ready", value: "24/7" }
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <p className="text-2xl font-black tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_40px_70px_-40px_rgba(15,23,42,0.55)] sm:p-6">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                Query Preview
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                Optimized
              </span>
            </div>
            <div className="rounded-2xl bg-slate-950 p-5 font-mono text-xs leading-6 text-slate-200">
              <p className="text-emerald-400">-- monthly active users by plan</p>
              <p>SELECT plan, COUNT(user_id) AS active_users</p>
              <p>FROM subscriptions</p>
              <p>WHERE status = 'active'</p>
              <p>AND created_at &gt;= DATE_TRUNC('month', NOW())</p>
              <p>GROUP BY plan</p>
              <p>ORDER BY active_users DESC;</p>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Estimated Runtime
              </p>
              <p className="mt-1 text-3xl font-black tracking-tight text-emerald-600">12ms</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Core Features</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Designed for developers, analysts, and fast-moving teams.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map((item) => (
              <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="inline-flex rounded-2xl bg-slate-900 p-3 text-emerald-400">
                  <item.icon size={18} />
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Workflow</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Three steps from idea to executable SQL.
              </h2>
            </div>
            <p className="max-w-md text-sm font-medium leading-relaxed text-slate-500">
              Structured flow keeps query quality high while reducing manual syntax work.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {workflow.map((step, index) => (
              <article key={step.title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Step {index + 1}
                  </span>
                  <span className="rounded-xl bg-white p-2 text-emerald-600">
                    <step.icon size={16} />
                  </span>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Pricing</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Start free. Upgrade when your workload grows.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Starter</h3>
              <p className="mt-4 text-6xl font-black tracking-tight text-slate-900">$0</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">per month</p>
              <ul className="mt-8 space-y-3">
                {["Core SQL generation", "Limited monthly queries", "Basic history"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-5 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
              >
                Create Free Account
              </Link>
            </article>

            <article className="relative overflow-hidden rounded-[2rem] border border-emerald-300 bg-slate-900 p-8 text-white shadow-[0_40px_70px_-40px_rgba(16,185,129,0.65)]">
              <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-emerald-500/20 blur-2xl" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Professional</h3>
              <p className="mt-4 text-6xl font-black tracking-tight">INR 499</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-300">per month</p>
              <ul className="mt-8 space-y-3">
                {[
                  "Unlimited SQL generation",
                  "Advanced optimization insights",
                  "Billing records and account controls",
                  "Priority support"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/billing"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-slate-950 transition-colors hover:bg-emerald-400"
              >
                Upgrade Now
                <ArrowRight size={14} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">FAQ</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Common questions before you onboard.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {faqs.map((item) => (
              <article key={item.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-black tracking-tight text-slate-900">{item.q}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Team</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Meet the developers building this platform.
              </h2>
            </div>
            <Link
              to="/developers"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              Open Team Page
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {developersPreview.map((dev) => (
              <article key={dev.name} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <img src={dev.image} alt={dev.name} className="h-80 w-full bg-slate-100 p-2 object-contain sm:h-96" />
                <div className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">{dev.role}</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{dev.name}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{dev.shortBio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-6xl rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white sm:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Ready to Build?</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Move from prompt to production SQL with confidence.
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-slate-300 sm:text-base">
                Create your account, run real workflows, and upgrade when your usage scales.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-emerald-400"
              >
                Start Free
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-600 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            AI SQL Studio - {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-900">
              Login
            </Link>
            <Link to="/register" className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-900">
              Register
            </Link>
            <Link to="/developers" className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-900">
              Developers
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              <Clock3 size={11} />
              System Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
