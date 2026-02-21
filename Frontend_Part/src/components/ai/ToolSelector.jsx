import React from 'react';
import { Sparkles, Search, ShieldCheck, Zap } from "lucide-react";

const tools = [
  { id: "generate", label: "Generate", icon: <Sparkles size={14} />, color: "text-emerald-500" },
  { id: "optimize", label: "Optimize", icon: <Zap size={14} />, color: "text-amber-500" },
  { id: "explain", label: "Explain", icon: <Search size={14} />, color: "text-blue-500" },
  { id: "validate", label: "Validate", icon: <ShieldCheck size={14} />, color: "text-purple-500" },
];

export default function ToolSelector({ mode, setMode }) {
  return (
    <div className="w-full lg:w-fit p-1.5 bg-slate-100 rounded-[22px] border border-slate-200 shadow-inner">
      <div className="grid grid-cols-2 lg:flex lg:flex-row items-center gap-1.5">
        {tools.map((tool) => {
          const isActive = mode === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setMode(tool.id)}
              className={`
                flex items-center justify-center gap-2.5 px-4 py-3 lg:py-2.5 rounded-[16px] 
                text-[11px] font-black uppercase tracking-widest transition-all duration-300
                ${isActive 
                  ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" 
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                }
              `}
            >
              <span className={`transition-transform duration-500 ${isActive ? `${tool.color} scale-110` : "text-slate-400"}`}>
                {tool.icon}
              </span>
              <span className="whitespace-nowrap">{tool.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}