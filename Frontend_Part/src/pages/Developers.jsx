import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Code2, Github, Linkedin, Mail } from "lucide-react";
import { developers } from "../data/developers";

export default function Developers() {
  return (
    <div className="public-page">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700 transition-all hover:border-slate-300 hover:text-slate-950"
          >
            <ArrowLeft size={14} />
            Back Home
          </Link>

          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0f766e]">
            <Code2 size={14} />
            Team Showcase
          </span>
        </div>
      </header>

      <main className="px-5 py-14 sm:px-8">
        <section className="mx-auto w-full max-w-7xl">
          <div className="public-card relative overflow-hidden rounded-[2.2rem] px-6 py-8 sm:px-10 sm:py-12">
            <div className="absolute -right-14 top-0 h-44 w-44 rounded-full bg-[#0f766e]/12 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#c76b2d]/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#0f766e]">
                People Behind The Product
              </p>
              <h1 className="display-font mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Meet the developers shaping AI SQL Studio.
              </h1>
              <p className="mt-5 text-sm font-medium leading-8 text-slate-600 sm:text-base">
                This page highlights the builders behind the product experience,
                frontend polish, backend architecture, and AI-driven workflow.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {developers.map((dev) => (
              <article key={dev.name} className="public-card overflow-hidden rounded-[1.9rem]">
                <div className="bg-slate-100 p-4">
                  <img
                    src={dev.image}
                    alt={dev.name}
                    className="h-80 w-full rounded-[1.5rem] object-cover object-top"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]">
                        {dev.role}
                      </p>
                      <h2 className="display-font mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
                        {dev.name}
                      </h2>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      Builder
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{dev.bio}</p>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${dev.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-300 hover:text-slate-950"
                    >
                      <Mail size={12} />
                      Mail
                    </a>
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-300 hover:text-slate-950"
                    >
                      <Github size={12} />
                      GitHub
                    </a>
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-300 hover:text-slate-950"
                    >
                      <Linkedin size={12} />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#112129] px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f766e]"
            >
              Create Workspace
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
