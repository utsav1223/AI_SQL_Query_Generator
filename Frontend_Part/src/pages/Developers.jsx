import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Code2, Github, Linkedin, Mail } from "lucide-react";
import { developers } from "../data/developers";

const revealViewport = { once: false, amount: 0.18 };
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

export default function Developers() {
  return (
    <div className="public-page">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[60px] w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          >
            <ArrowLeft size={14} />
            Back Home
          </Link>

          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f766e]">
            <Code2 size={14} />
            Team Showcase
          </span>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-7xl">
          <motion.div
            className="public-card relative overflow-hidden rounded-lg px-5 py-7 sm:px-8 sm:py-9"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div className="relative max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0f766e]">
                People Behind The Product
              </p>
              <h1 className="display-font mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Meet the developers shaping AI SQL Studio.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600">
                This page highlights the builders behind the product experience,
                frontend polish, backend architecture, and AI-driven workflow.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={revealViewport}
          >
            {developers.map((dev) => (
              <motion.article key={dev.name} variants={fadeUp} className="public-card overflow-hidden rounded-lg transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">
                <div className="bg-slate-100 p-3">
                  <img
                    src={dev.image}
                    alt={dev.name}
                    loading="lazy"
                    className="h-72 w-full rounded-md bg-slate-100 object-contain object-center"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#0f766e]">
                        {dev.role}
                      </p>
                      <h2 className="display-font mt-2 text-xl font-bold tracking-tight text-slate-950">
                        {dev.name}
                      </h2>
                    </div>
                    <span className="rounded-md border border-slate-200 bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Builder
                    </span>
                  </div>

                  <p className="mt-3 text-[13px] font-medium leading-6 text-slate-600">{dev.bio}</p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${dev.email}`}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                    >
                      <Mail size={12} />
                      Mail
                    </a>
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                    >
                      <Github size={12} />
                      GitHub
                    </a>
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                    >
                      <Linkedin size={12} />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>

          <div className="mt-10 flex justify-center">
            <Link
              to="/register"
              style={{ color: "#ffffff" }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#112129] bg-[#112129] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] !text-white shadow-sm transition-all hover:border-[#0f766e] hover:bg-[#0f766e] hover:!text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
            >
              <span className="text-white">Create Workspace</span>
              <ArrowUpRight size={14} className="text-white" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
