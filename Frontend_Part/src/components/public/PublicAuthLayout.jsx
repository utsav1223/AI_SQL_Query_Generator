import { Link } from "react-router-dom";
import { ArrowUpRight, Database, ShieldCheck, Sparkles } from "lucide-react";

const defaultMetrics = [
  { label: "Workspace", value: "Secure" },
  { label: "SQL Flow", value: "Guided" },
  { label: "Access", value: "Token Based" }
];

export default function PublicAuthLayout({
  badge,
  title,
  description,
  highlights = [],
  imageUrl,
  children
}) {
  return (
    <div className="public-page overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-[1480px] gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <aside className="public-dark-panel relative hidden overflow-hidden rounded-[2.2rem] lg:flex">
          <div className="public-grid absolute inset-0 opacity-10" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#8fe1cf]">
                  <Database size={18} />
                </span>
                <div>
                  <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]">
                    AI SQL Studio
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                    Simple SQL workspace
                  </p>
                </div>
              </Link>

              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/85 transition-all hover:bg-white/14"
              >
                Home
                <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="max-w-xl space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#8fe1cf]/26 bg-[#8fe1cf]/10 px-4 py-2 text-[#8fe1cf]">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">{badge}</span>
              </div>

              <div>
                <h1 className="display-font text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] xl:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-lg text-base font-medium leading-8 text-slate-200/88">
                  {description}
                </p>
              </div>

              {imageUrl ? (
                <div className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/6 p-3">
                  <img
                    src={imageUrl}
                    alt="Workspace preview"
                    className="h-56 w-full rounded-[1.35rem] object-cover"
                  />
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                {defaultMetrics.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4"
                  >
                    <p className="display-font text-2xl font-extrabold tracking-tight text-white">
                      {item.value}
                    </p>
                    <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/55">
                      {item.label}
                    </p>
                  </article>
                ))}
              </div>

              {highlights.length ? (
                <div className="rounded-[1.8rem] border border-white/10 bg-white/7 p-6">
                  <div className="mb-4 inline-flex items-center gap-2 text-[#8fe1cf]">
                    <Sparkles size={15} />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">
                      What you get
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm font-semibold leading-7 text-slate-100"
                      >
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#8fe1cf]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/45">
              Clear onboarding surface for your SaaS frontend
            </p>
          </div>
        </aside>

        <main className="flex items-center justify-center">
          <div className="public-card w-full max-w-[620px] rounded-[2.2rem] px-6 py-7 sm:px-8 sm:py-9">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#112129] text-[#8fe1cf]">
                  <Database size={18} />
                </span>
                <div>
                  <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em] text-slate-950">
                    AI SQL Studio
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Secure auth flow
                  </p>
                </div>
              </Link>

              <div className="hidden rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e] sm:inline-flex">
                Auth Portal
              </div>
            </div>

            <div className="mb-8 space-y-5 lg:hidden">
              <div className="public-pill rounded-full px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em]">
                <ShieldCheck size={13} />
                {badge}
              </div>

              <div>
                <h1 className="display-font text-3xl font-extrabold tracking-tight text-slate-950">
                  {title}
                </h1>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{description}</p>
              </div>

              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Workspace preview"
                  className="h-40 w-full rounded-[1.5rem] border border-slate-200 object-cover"
                />
              ) : null}

              {highlights.length ? (
                <div className="public-outline-card rounded-[1.6rem] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]">
                    Highlights
                  </p>
                  <ul className="mt-3 space-y-2">
                    {highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0f766e]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
