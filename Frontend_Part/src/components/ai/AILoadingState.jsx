import { useEffect, useMemo, useState } from "react";
import { AlignLeft, Bot, BrainCircuit, SearchCheck, ShieldCheck, Sparkles, WandSparkles, Zap } from "lucide-react";

const icons = [Sparkles, BrainCircuit, WandSparkles, Bot];

const modeSteps = {
  generate: [
    "Reading schema context",
    "Planning joins and filters",
    "Writing SQL",
    "Checking the result"
  ],
  optimize: [
    "Reading query structure",
    "Finding slow patterns",
    "Rewriting SQL",
    "Polishing the output"
  ],
  format: [
    "Reading SQL shape",
    "Normalizing indentation",
    "Aligning clauses",
    "Preparing formatted SQL"
  ],
  validate: [
    "Checking syntax",
    "Reviewing logic",
    "Finding edge cases",
    "Preparing feedback"
  ],
  explain: [
    "Reading SQL",
    "Mapping each clause",
    "Simplifying the flow",
    "Writing explanation"
  ]
};

const modeMeta = {
  generate: { label: "Generating SQL", icon: Sparkles },
  optimize: { label: "Optimizing SQL", icon: Zap },
  format: { label: "Formatting SQL", icon: AlignLeft },
  validate: { label: "Validating SQL", icon: ShieldCheck },
  explain: { label: "Explaining SQL", icon: SearchCheck }
};

const dotColors = ["bg-blue-500", "bg-red-500", "bg-amber-400", "bg-emerald-500"];

export function AILoadingIcon({ className = "", compact = false }) {
  const [iconIndex, setIconIndex] = useState(0);
  const Icon = icons[iconIndex % icons.length];
  const orbit = compact ? 11 : 18;
  const iconSize = compact ? 12 : 16;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIconIndex((current) => current + 1);
    }, 620);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-flex h-9 w-9 items-center justify-center ${className}`}>
      <span className="absolute inset-0 rounded-full border border-teal-200 bg-white dark:border-teal-500/30 dark:bg-slate-900" />
      {dotColors.map((color, index) => (
        <span
          key={color}
          className={`absolute h-2 w-2 rounded-full ${color} animate-pulse`}
          style={{
            transform: `rotate(${index * 90}deg) translateY(-${orbit}px)`,
            animationDelay: `${index * 140}ms`
          }}
        />
      ))}
      <Icon size={iconSize} className="relative text-teal-700 transition-all duration-300 dark:text-teal-300" />
    </span>
  );
}

export default function AILoadingState({ mode = "generate" }) {
  const steps = modeSteps[mode] || modeSteps.generate;
  const meta = modeMeta[mode] || modeMeta.generate;
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = useMemo(
    () => steps[stepIndex % steps.length],
    [stepIndex, steps]
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepIndex((current) => current + 1);
    }, 950);

    return () => window.clearInterval(interval);
  }, [mode]);

  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-dashed border-teal-200 bg-teal-50/45 px-6 text-center dark:border-teal-500/30 dark:bg-teal-500/10">
      <AILoadingIcon className="h-16 w-16" />

      <div className="mt-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
          {meta.label}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
          {currentStep}
        </h2>
        <p className="mt-2 max-w-sm text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
          AI is working through your request. The result will appear here automatically.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-1.5">
        {dotColors.map((color, index) => (
          <span
            key={color}
            className={`h-2.5 w-2.5 rounded-full ${color} animate-bounce`}
            style={{ animationDelay: `${index * 130}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
