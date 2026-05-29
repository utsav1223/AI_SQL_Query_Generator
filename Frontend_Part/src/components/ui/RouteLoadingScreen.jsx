import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  LockKeyhole,
  Server,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const loadingStates = [
  { icon: ShieldCheck, label: "Verifying access" },
  { icon: Database, label: "Loading workspace" },
  { icon: Server, label: "Syncing services" },
  { icon: Sparkles, label: "Preparing tools" }
];

const getLoadingCopy = (label) => {
  const normalizedLabel = label.toLowerCase();

  if (
    normalizedLabel.includes("session") ||
    normalizedLabel.includes("auth") ||
    normalizedLabel.includes("access") ||
    normalizedLabel.includes("secure")
  ) {
    return {
      eyebrow: "Secure sign in",
      title: "Securing your workspace",
      description: "Your session is being verified before the dashboard opens."
    };
  }

  if (normalizedLabel.includes("admin")) {
    return {
      eyebrow: "Admin console",
      title: "Preparing admin controls",
      description: "Loading protected tools and permissions."
    };
  }

  return {
    eyebrow: "AI SQL Studio",
    title: "Preparing your workspace",
    description: "Loading your dashboard, schema tools, and recent activity."
  };
};

export default function RouteLoadingScreen({ label = "Preparing workspace..." }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeState = loadingStates[activeIndex];
  const ActiveIcon = activeState.icon;
  const copy = getLoadingCopy(label);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % loadingStates.length);
    }, 1050);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950 dark:bg-slate-950 dark:text-slate-100"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-slate-200/80 py-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <span className="route-loader-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#10232d] text-teal-200 shadow-sm dark:bg-slate-900">
              <Database size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                AI SQL Studio
              </p>
              <p className="truncate text-sm font-bold text-slate-950 dark:text-slate-100">
                Enterprise workspace
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Secure connection
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:py-12">
          <section className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <ActiveIcon key={activeState.label} size={14} className="text-[var(--accent)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                {activeState.label}
              </span>
            </div>

            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
              {copy.description}
            </p>

            <div className="mt-8 max-w-lg">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {label}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Protected
                </p>
              </div>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <span className="route-loader-progress absolute inset-y-0 left-0 rounded-full bg-[#10232d] dark:bg-teal-300" />
              </div>
            </div>

            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
              <SignalCard label="Identity" value="Verified" tone="emerald" />
              <SignalCard label="API" value="Ready" tone="sky" />
              <SignalCard label="Data" value="Private" tone="amber" />
            </div>
          </section>

          <section className="hidden min-w-0 lg:block" aria-hidden="true">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_26px_80px_-56px_rgba(15,23,42,0.38)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="h-2.5 w-36 rounded-full bg-slate-100 dark:bg-slate-800" />
              </div>

              <div className="grid min-h-[420px] grid-cols-[150px_minmax(0,1fr)]">
                <aside className="border-r border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#10232d] text-teal-200">
                      <LockKeyhole size={14} />
                    </span>
                    <div className="space-y-2">
                      <div className="h-2 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-2 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {["w-24", "w-20", "w-28", "w-16"].map((width) => (
                      <div
                        key={width}
                        className={`route-loader-skeleton h-8 rounded-md bg-slate-200 dark:bg-slate-800 ${width}`}
                      />
                    ))}
                  </div>
                </aside>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="route-loader-skeleton h-3 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="route-loader-skeleton mt-3 h-8 w-72 max-w-full rounded-md bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
                      <Activity size={18} className="route-loader-icon" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <PreviewMetric tone="bg-emerald-500" />
                    <PreviewMetric tone="bg-sky-500" />
                    <PreviewMetric tone="bg-amber-400" />
                  </div>

                  <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="route-loader-skeleton h-3 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="h-7 w-20 rounded-md bg-[#10232d] dark:bg-teal-300" />
                    </div>
                    <div className="space-y-3">
                      <div className="route-loader-skeleton h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="route-loader-skeleton h-3 w-11/12 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="route-loader-skeleton h-3 w-4/5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </div>
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

function SignalCard({ label, value, tone }) {
  const toneClass = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    amber: "bg-amber-400"
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${toneClass}`} />
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm font-bold text-slate-950 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function PreviewMetric({ tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className={`h-2 w-10 rounded-full ${tone}`} />
      <div className="route-loader-skeleton mt-4 h-7 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
      <div className="route-loader-skeleton mt-3 h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
