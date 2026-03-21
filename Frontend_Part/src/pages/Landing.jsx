import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  Layers3,
  LineChart,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap
} from "lucide-react";
import { developers } from "../data/developers";

const featureCards = [
  {
    title: "Prompt-to-SQL Workspace",
    desc: "Turn plain-language requests into schema-aware SQL with a focused interface built for real project work.",
    icon: Bot
  },
  {
    title: "Performance Review Tools",
    desc: "Validate, optimize, and inspect generated SQL before it reaches production or a client demo.",
    icon: LineChart
  },
  {
    title: "Billing and Workspace Control",
    desc: "Manage plan upgrades, query history, support flows, and user lifecycle from the same product.",
    icon: ShieldCheck
  }
];

const workflow = [
  {
    title: "Add Schema Context",
    desc: "Paste or save table structure so the AI works with your real columns and relationships.",
    icon: Database
  },
  {
    title: "Describe the Query",
    desc: "Use simple language to explain the report, analytics requirement, or SQL task you need.",
    icon: Sparkles
  },
  {
    title: "Review and Ship",
    desc: "Generate, validate, format, and store the final query in a dashboard that is easy to audit later.",
    icon: Workflow
  }
];

const faqs = [
  {
    q: "Is this only for beginners?",
    a: "No. The UI is easy to understand, but the workflow is designed to stay useful as your project becomes more production-focused."
  },
  {
    q: "Can I save schema context before generating SQL?",
    a: "Yes. The dashboard supports schema management so generated output stays closer to your actual database structure."
  },
  {
    q: "Does the platform support billing and account upgrades?",
    a: "Yes. Subscription, invoices, and account lifecycle flows are already part of the product."
  },
  {
    q: "Can I start on a free plan first?",
    a: "Yes. Free access lets you explore the core workflow before moving to Pro features."
  }
];

const quickStats = [
  { label: "AI Workspace", value: "Schema-Aware" },
  { label: "Response Style", value: "Debug Friendly" },
  { label: "Deployment Fit", value: "MERN Ready" }
];

const platformSignals = [
  "Natural-language SQL generation",
  "Usage-aware SaaS flow",
  "Admin, billing, and support surface"
];

const developersPreview = developers.slice(0, 3);

export default function Landing() {
  return (
    <div className="min-h-screen text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-900/6 bg-white/72 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#112129] text-[#8fe1cf] shadow-[0_18px_30px_-20px_rgba(17,33,41,0.9)]">
              <Database size={18} />
            </span>
            <div>
              <p className="display-font text-sm font-extrabold tracking-[0.24em] text-slate-950 uppercase">
                AI SQL Studio
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Intelligent Query Workspace
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {[
              ["Features", "#features"],
              ["Workflow", "#workflow"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"]
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-950"
              >
                {label}
              </a>
            ))}
            <Link
              to="/developers"
              className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-950"
            >
              Team
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700 transition-all hover:border-slate-900/18 hover:text-slate-950 sm:inline-flex"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#112129] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_16px_30px_-22px_rgba(17,33,41,0.95)] transition-all hover:-translate-y-0.5 hover:bg-[#0f766e]"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
          <div className="public-grid absolute inset-0 opacity-50" />
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#0f766e]/14 blur-3xl" />
          <div className="absolute right-0 top-12 h-80 w-80 rounded-full bg-[#c76b2d]/12 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="animated-rise">
              <div className="public-pill rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em]">
                <Zap size={14} />
                Production-focused SQL workflow
              </div>

              <h1 className="display-font mt-7 max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
                A professional frontend for generating, refining, and managing SQL.
              </h1>

              <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                AI SQL Studio brings query generation, schema context, billing, history,
                and support into one clean SaaS workspace that feels ready for internships,
                demos, and real deployment.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-[#112129] px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f766e]"
                >
                  Launch Workspace
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-700 transition-all hover:border-slate-900/18 hover:bg-white"
                >
                  Open Dashboard
                </Link>
                <Link
                  to="/developers"
                  className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-600 transition-colors hover:text-slate-950"
                >
                  Meet The Team
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {quickStats.map((stat) => (
                  <article
                    key={stat.label}
                    className="public-card rounded-[1.6rem] px-5 py-5"
                  >
                    <p className="display-font text-2xl font-extrabold tracking-tight text-slate-950">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
                      {stat.label}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="animated-rise [animation-delay:140ms]">
              <div className="public-card animated-float relative overflow-hidden rounded-[2rem] p-5 sm:p-6">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#0f766e]/40 to-transparent" />
                <div className="grid gap-4">
                  <div className="rounded-[1.8rem] bg-[#112129] p-5 text-white shadow-[0_30px_60px_-40px_rgba(17,33,41,0.95)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#8fe1cf]">
                          Workspace Signal
                        </p>
                        <h2 className="display-font mt-2 text-2xl font-extrabold tracking-tight">
                          Live Query Pipeline
                        </h2>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/80">
                        Stable
                      </span>
                    </div>

                    <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-[#0b171d] p-4">
                      <div className="mb-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                        <span>Generated SQL</span>
                        <span>Schema aware</span>
                      </div>
                      <pre className="mono-font overflow-x-auto text-[12px] leading-6 text-slate-200">
{`SELECT plan,
       COUNT(user_id) AS active_users
FROM subscriptions
WHERE status = 'active'
GROUP BY plan
ORDER BY active_users DESC;`}
                      </pre>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                    <article className="public-outline-card rounded-[1.6rem] p-5">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
                        Product Surface
                      </p>
                      <div className="mt-4 grid gap-3">
                        {platformSignals.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-2xl border border-slate-900/8 bg-white/80 px-4 py-3"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#112129] text-[#8fe1cf]">
                              <CheckCircle2 size={16} />
                            </span>
                            <span className="text-sm font-semibold text-slate-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="public-outline-card rounded-[1.6rem] p-5">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
                        Runtime
                      </p>
                      <p className="display-font mt-3 text-4xl font-extrabold tracking-tight text-[#0f766e]">
                        12ms
                      </p>
                      <div className="glow-divider mt-4" />
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                            Accuracy
                          </p>
                          <p className="mt-1 text-lg font-bold text-slate-900">Schema constrained</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                            Visibility
                          </p>
                          <p className="mt-1 text-lg font-bold text-slate-900">History + billing</p>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-6 sm:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-3">
            {[
              {
                title: "Professional First Impression",
                text: "Clean sections, stronger typography, and balanced spacing make the product feel deployment-ready."
              },
              {
                title: "Clear Product Story",
                text: "Users immediately understand the flow: schema, prompt, result, billing, and support."
              },
              {
                title: "Better Trust Signals",
                text: "Metrics, workflow steps, and team visibility make the frontend feel more credible and complete."
              }
            ].map((item) => (
              <article key={item.title} className="public-outline-card rounded-[1.7rem] p-6">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f766e]">
                  Why it feels better
                </p>
                <h3 className="display-font mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="px-5 py-20 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#0f766e]">
                Core Features
              </p>
              <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                A frontend that looks polished and still explains the product clearly.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((item) => (
                <article key={item.title} className="public-card rounded-[1.8rem] p-7">
                  <div className="flex h-13 w-13 items-center justify-center rounded-[1.2rem] bg-[#112129] text-[#8fe1cf] shadow-[0_18px_30px_-22px_rgba(17,33,41,0.9)]">
                    <item.icon size={20} />
                  </div>
                  <h3 className="display-font mt-6 text-2xl font-extrabold tracking-tight text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="px-5 py-20 sm:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-[2.2rem] bg-[#112129] px-6 py-8 text-white shadow-[0_40px_90px_-48px_rgba(17,33,41,0.95)] sm:px-10 sm:py-12">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#8fe1cf]">
                  Workflow
                </p>
                <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Three simple steps from idea to executable SQL.
                </h2>
              </div>
              <p className="max-w-md text-sm font-medium leading-7 text-slate-300">
                The structure stays beginner-friendly while still matching what a real SaaS
                product should look and feel like.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {workflow.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-[1.8rem] border border-white/8 bg-white/6 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/55">
                      Step {index + 1}
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8fe1cf] text-[#112129]">
                      <step.icon size={18} />
                    </span>
                  </div>
                  <h3 className="display-font mt-6 text-2xl font-extrabold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-300">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-5 py-20 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-12 text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#0f766e]">
                Pricing
              </p>
              <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Start simple, then unlock the full workspace.
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <article className="public-card rounded-[2rem] p-8">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
                  Starter
                </p>
                <p className="display-font mt-4 text-6xl font-extrabold tracking-tight text-slate-950">
                  Free
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Good for learning the platform and testing core generation flow.
                </p>
                <ul className="mt-8 space-y-3">
                  {["Core SQL generation", "Saved history", "Simple onboarding"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <CheckCircle2 size={17} className="text-[#0f766e]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700 transition-all hover:border-slate-900/18 hover:bg-slate-50"
                >
                  Create Free Account
                </Link>
              </article>

              <article className="relative overflow-hidden rounded-[2rem] bg-[#112129] p-8 text-white shadow-[0_40px_90px_-50px_rgba(17,33,41,0.95)]">
                <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[#8fe1cf]/18 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-[#c76b2d]/18 blur-3xl" />
                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8fe1cf]">
                        Professional
                      </p>
                      <p className="display-font mt-4 text-6xl font-extrabold tracking-tight">
                        INR 499
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/80">
                      Most Complete
                    </span>
                  </div>

                  <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-300">
                    Built for users who want optimization, validation, explain mode, invoices,
                    and a more complete SaaS workflow.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      "Unlimited generation and query review",
                      "Advanced optimize, validate, and explain tools",
                      "Invoices and subscription management",
                      "Priority support and stronger workflow visibility"
                    ].map((item) => (
                      <div key={item} className="rounded-[1.4rem] border border-white/8 bg-white/6 px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 text-[#8fe1cf]">
                            <CheckCircle2 size={16} />
                          </span>
                          <p className="text-sm font-semibold leading-6 text-slate-100">{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/billing"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#8fe1cf] px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#112129] transition-all hover:-translate-y-0.5 hover:bg-[#a4eadb]"
                  >
                    Upgrade To Pro
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="px-5 py-20 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#0f766e]">
                FAQ
              </p>
              <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Common questions before someone signs up.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {faqs.map((item) => (
                <article key={item.q} className="public-card rounded-[1.6rem] p-6">
                  <h3 className="display-font text-2xl font-extrabold tracking-tight text-slate-950">
                    {item.q}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#0f766e]">
                  Team
                </p>
                <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                  The people behind the product experience.
                </h2>
              </div>
              <Link
                to="/developers"
                className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:text-slate-950"
              >
                Full Team Page
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {developersPreview.map((dev) => (
                <article key={dev.name} className="public-card overflow-hidden rounded-[1.8rem]">
                  <div className="relative h-72 overflow-hidden bg-slate-200">
                    <img
                      src={dev.image}
                      alt={dev.name}
                      className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/45 to-transparent" />
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]">
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

        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-[2.2rem] bg-[#112129] px-6 py-8 text-white shadow-[0_40px_90px_-50px_rgba(17,33,41,0.95)] sm:px-10 sm:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#8fe1cf]">
                  Ready To Build
                </p>
                <h2 className="display-font mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Give your project a cleaner, more professional frontend.
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
                  Start with the free workspace, move into advanced tools when needed,
                  and keep the whole product looking polished from landing page to dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8fe1cf] px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#112129] transition-all hover:-translate-y-0.5 hover:bg-[#a4eadb]"
                >
                  Start Free
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/8 px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition-all hover:bg-white/14"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/6 bg-white/72 px-5 py-8 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              AI SQL Studio
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Designed to feel clean, capable, and deployment-ready.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/login" className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500 hover:text-slate-950">
              Login
            </Link>
            <Link to="/register" className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500 hover:text-slate-950">
              Register
            </Link>
            <Link to="/developers" className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500 hover:text-slate-950">
              Developers
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0f766e]/14 bg-white/75 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">
              <Clock3 size={12} />
              Workspace Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
