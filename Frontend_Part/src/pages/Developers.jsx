import { Link } from "react-router-dom";
import { ArrowLeft, Code2, Github, Linkedin, Mail } from "lucide-react";
import { developers } from "../data/developers";

export default function Developers() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft size={14} />
            Back Home
          </Link>

          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
            <Code2 size={14} />
            Meet The Developers
          </span>
        </div>
      </header>

      <main className="px-5 py-14 sm:px-8 sm:py-18">
        <section className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
              Team
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              People behind AI SQL Studio.
            </h1>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              This team combines product engineering, frontend craftsmanship, and AI systems expertise to deliver reliable SQL workflows.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {developers.map((dev) => (
              <article key={dev.name} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <img src={dev.image} alt={dev.name} className="h-80 w-full object-cover object-top sm:h-96" />
                <div className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    {dev.role}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{dev.name}</h2>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{dev.bio}</p>

                  <div className="mt-5 flex items-center gap-2">
                    <a
                      href={`mailto:${dev.email}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      <Mail size={12} />
                      Mail
                    </a>
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      <Github size={12} />
                      GitHub
                    </a>
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      <Linkedin size={12} />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
