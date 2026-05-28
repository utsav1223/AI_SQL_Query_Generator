import { Database, Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import Skeleton from "./Skeleton";

export default function RouteLoadingScreen({ label = "Loading workspace..." }) {
  const isSessionRestore = label.toLowerCase().includes("session");
  const title = isSessionRestore ? "Restoring your secure workspace" : "Preparing your workspace";
  const description = isSessionRestore
    ? "We are validating your saved session and reconnecting your dashboard."
    : "The next page is loading with your workspace settings and tools.";

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7fb_46%,#edf3f7_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
    >
      <div className="fixed inset-x-0 top-0 h-1 bg-slate-200">
        <div className="h-full w-1/3 animate-pulse bg-teal-600" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#10232d] text-teal-300">
              <Database size={18} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                AI SQL Studio
              </p>
              <p className="text-sm font-bold text-slate-950">Workspace loading</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-md border border-teal-200 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-teal-800 shadow-sm sm:inline-flex">
            <Loader2 size={13} className="animate-spin" />
            In progress
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(380px,1fr)] lg:py-12">
          <section className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-800">
              <LockKeyhole size={13} />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{label}</span>
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-slate-600">{description}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <LoadingStep icon={ShieldCheck} label="Session" value="Protected" />
              <LoadingStep icon={Sparkles} label="Interface" value="Optimizing" />
              <LoadingStep icon={Database} label="Workspace" value="Syncing" />
            </div>
          </section>

          <section className="min-w-0 border border-slate-200 bg-white shadow-[0_24px_70px_-54px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Secure preview
              </span>
            </div>

            <div className="grid gap-5 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="mt-3 h-7 w-56 max-w-full rounded-md" />
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
              </div>

              <div className="grid gap-3 lg:grid-cols-[0.8fr_1fr]">
                <div className="space-y-3 border border-slate-200 bg-slate-50 p-4">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-3 w-full rounded-md" />
                  <Skeleton className="h-3 w-5/6 rounded-md" />
                  <Skeleton className="h-3 w-2/3 rounded-md" />
                </div>

                <div className="space-y-3 border border-slate-200 p-4">
                  <div className="grid grid-cols-[1fr_72px] gap-3">
                    <Skeleton className="h-3 rounded-md" />
                    <Skeleton className="h-3 rounded-md" />
                  </div>
                  <div className="grid grid-cols-[1fr_72px] gap-3">
                    <Skeleton className="h-3 rounded-md" />
                    <Skeleton className="h-3 rounded-md" />
                  </div>
                  <div className="grid grid-cols-[1fr_72px] gap-3">
                    <Skeleton className="h-3 rounded-md" />
                    <Skeleton className="h-3 rounded-md" />
                  </div>
                  <div className="grid grid-cols-[1fr_72px] gap-3">
                    <Skeleton className="h-3 rounded-md" />
                    <Skeleton className="h-3 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function LoadingStep({ icon, label, value }) {
  const Icon = icon;

  return (
    <div className="border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-teal-700">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}
