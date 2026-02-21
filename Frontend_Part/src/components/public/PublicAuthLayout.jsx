import { Link } from "react-router-dom";
import { Database, ShieldCheck } from "lucide-react";

export default function PublicAuthLayout({
  badge,
  title,
  description,
  highlights = [],
  imageUrl,
  children
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-4 p-4 sm:p-6">
        <aside className="relative hidden w-1/2 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-900 lg:flex">
          <img
            src={imageUrl}
            alt="Workspace"
            className="absolute inset-0 h-full w-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/75 to-emerald-950/75" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14 text-white">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md transition-colors hover:bg-white/15"
              >
                <div className="rounded-xl bg-emerald-500/20 p-2">
                  <Database size={16} className="text-emerald-300" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em]">AI SQL Studio</span>
              </Link>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-emerald-200">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{badge}</span>
              </div>

              <h1 className="max-w-lg text-5xl font-black tracking-tight leading-tight">
                {title}
              </h1>

              <p className="max-w-md text-base font-medium text-slate-200/90 leading-relaxed">
                {description}
              </p>

              <ul className="space-y-3">
                {highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm font-semibold text-white/90"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <main className="flex w-full items-center justify-center lg:w-1/2">
          <div className="w-full max-w-[560px] rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-8">
            <Link to="/" className="mb-8 inline-flex items-center gap-2">
              <span className="rounded-xl bg-emerald-600 p-2 text-white">
                <Database size={16} />
              </span>
              <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
                AI SQL Studio
              </span>
            </Link>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
