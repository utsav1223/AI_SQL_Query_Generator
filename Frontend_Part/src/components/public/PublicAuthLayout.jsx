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
    <div className="min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-[1500px] gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden rounded-[2.2rem] bg-[#112129] text-white shadow-[0_40px_90px_-48px_rgba(17,33,41,0.98)] lg:flex">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Workspace preview"
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
          ) : null}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(143,225,207,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(199,107,45,0.18),transparent_28%),linear-gradient(145deg,rgba(17,33,41,0.96),rgba(11,23,29,0.95))]" />
          <div className="public-grid absolute inset-0 opacity-20" />

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
                    Clean SQL workspace
                  </p>
                </div>
              </Link>

              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/85 transition-all hover:bg-white/12"
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
                <h1 className="display-font text-5xl font-extrabold leading-[1] tracking-[-0.04em] xl:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-lg text-base font-medium leading-8 text-slate-200/88">
                  {description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {defaultMetrics.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-[1.4rem] border border-white/10 bg-white/7 px-4 py-4 backdrop-blur-sm"
                  >
                    <p className="display-font text-2xl font-extrabold tracking-tight text-white">
                      {item.value}
                    </p>
                    <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/50">
                      {item.label}
                    </p>
                  </article>
                ))}
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
                <div className="mb-4 inline-flex items-center gap-2 text-[#8fe1cf]">
                  <Sparkles size={15} />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">
                    What you get
                  </span>
                </div>

                <ul className="space-y-3">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm font-semibold leading-7 text-slate-100">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#8fe1cf]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/45">
              Professional onboarding surface for your SaaS frontend
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

              <div className="hidden rounded-full border border-slate-900/8 bg-white/70 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e] sm:inline-flex">
                Auth Portal
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
