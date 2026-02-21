import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import { 
  Database, Save, RotateCcw, Clock, FileCode, HardDrive, 
  CheckCircle2, AlertCircle, Loader2, Cpu, ShieldCheck, ChevronRight
} from "lucide-react";

export default function Schema() {
  const [schemaText, setSchemaText] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [size, setSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => { fetchSchema(); }, []);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/schema", "GET");
      setSchemaText(data.schemaText || "");
      setLastUpdated(data.lastUpdated || null);
      setSize(data.size || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ text: "", type: "" });
      const res = await apiRequest("/schema", "POST", { schemaText });
      setLastUpdated(res.lastUpdated);
      setSize(res.size);
      setMessage({ text: "Schema context synchronized", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setMessage({ text: err?.message || "Synchronization failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Confirm deletion of schema context? This will affect AI accuracy.")) return;
    try {
      setClearing(true);
      setMessage({ text: "", type: "" });
      await apiRequest("/schema", "DELETE"); // Assuming standard DELETE route
      setSchemaText("");
      setSize(0);
      setLastUpdated(null);
      setMessage({ text: "Context purged successfully", type: "success" });
    } catch {
      setMessage({ text: "Failed to clear context", type: "error" });
    } finally {
      setClearing(false);
    }
  };

  const sizeInKB = (size / 1024).toFixed(2);
  const systemLimitKB = 20;
  const memoryUsagePercent = Math.min((parseFloat(sizeInKB) / systemLimitKB) * 100, 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="relative mb-6">
          <Loader2 className="animate-spin text-emerald-500" size={48} strokeWidth={1} />
          <div className="absolute inset-0 blur-2xl bg-emerald-500/20 rounded-full" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Calibrating Neural Map...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-100 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 w-fit">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calibration Studio</span>
          </div>
          <h1 className="dashboard-heading text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
            Schema <span className="text-emerald-500">Definition</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl text-lg">
            Paste your schema in DDL format only (CREATE TABLE, ALTER TABLE, FOREIGN KEY) to improve SQL generation accuracy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-black text-slate-400 hover:text-rose-600 transition-all uppercase tracking-widest bg-white border border-slate-200 rounded-2xl hover:border-rose-100 hover:bg-rose-50/50 disabled:opacity-50"
          >
            {clearing ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest active:scale-95"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Sync Context
          </button>
        </div>
      </header>

      {/* --- KPI TILES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard 
          icon={<HardDrive size={20} />} 
          title="Memory load" 
          value={`${sizeInKB} KB`} 
          subtitle="Enterprise Limit: 20KB"
          progress={memoryUsagePercent}
          accentColor="text-blue-600"
        />
        <InfoCard 
          icon={<Clock size={20} />} 
          title="Last Deployment" 
          value={lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "Pending"} 
          subtitle={lastUpdated ? `Synced at ${new Date(lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Sync required"}
          accentColor="text-amber-600"
        />
        <InfoCard 
          icon={<FileCode size={20} />} 
          title="Intelligence Awareness" 
          value={size > 0 ? "High" : "Inactive"} 
          subtitle="Model Calibration Status"
          isActive={size > 0}
          accentColor={size > 0 ? "text-emerald-600" : "text-slate-400"}
        />
      </div>

      {/* --- CODE EDITOR --- */}
      <div className="relative group">
        <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl transition-all group-focus-within:border-emerald-500/50">
          
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-8 py-5 bg-slate-950/50 border-b border-white/5">
             <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ddl_structure.sql</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Syntax Editor</span>
             </div>
          </div>

          <textarea
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            placeholder="-- Paste schema in DDL format only (CREATE TABLE / ALTER TABLE / CONSTRAINT / FOREIGN KEY)&#10;-- Example: CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255));"
            className="w-full h-[500px] bg-transparent p-8 md:p-10 text-base font-mono text-emerald-100/90 placeholder:text-slate-700 focus:outline-none resize-none custom-scrollbar leading-relaxed"
          />
        </div>

        {/* Floating Message Badge */}
        {message.text && (
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            message.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
          </div>
        )}
      </div>

      {/* --- FOOTER ADVISORY --- */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 text-slate-400">
          <AlertCircle size={16} />
          <p className="text-[11px] font-medium italic">
            Pro Tip: Include <span className="text-slate-900 font-bold">FOREIGN KEYS</span> to help the AI navigate complex multi-table joins.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Context Engine v4.0.2
        </div>
      </footer>
    </div>
  );
}

function InfoCard({ icon, title, value, subtitle, accentColor, progress, isActive }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group">
      <div className="flex items-center justify-between mb-8">
        <div className={`p-3 bg-slate-50 rounded-2xl ${accentColor} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        {progress !== undefined && (
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${progress > 80 ? 'bg-rose-500' : 'bg-blue-500'}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}
        {isActive !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{isActive ? 'Online' : 'Pending'}</span>
            <div className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}`} />
          </div>
        )}
      </div>
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
        <h3 className={`text-2xl font-black tracking-tight mt-1 ${accentColor}`}>
          {value}
        </h3>
        <p className="text-[11px] text-slate-400 font-medium mt-1 leading-tight opacity-80">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
