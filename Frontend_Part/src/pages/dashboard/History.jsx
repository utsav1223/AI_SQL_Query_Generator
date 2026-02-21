import { useEffect, useState, useContext, useCallback } from "react";
import { apiRequest } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { 
  Search, Filter, Pin, Trash2, Calendar, ChevronRight,
  PinOff, ArrowUpDown, Copy, Check, History as HistoryIcon,
  Sparkles, Code2, Trash, Database
} from "lucide-react";

export default function History() {
  const { user } = useContext(AuthContext);
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [copiedId, setCopiedId] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiRequest("/queries", "GET");
      setQueries(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, []);

  const applyFilters = useCallback(() => {
    let data = [...queries];
    if (modeFilter !== "all") data = data.filter((q) => q.mode === modeFilter);
    if (search.trim()) {
      data = data.filter((q) =>
        q.prompt?.toLowerCase().includes(search.toLowerCase()) ||
        q.generatedSQL?.toLowerCase().includes(search.toLowerCase())
      );
    }
    data.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    setFilteredQueries(data);
  }, [modeFilter, queries, search, sortOrder]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { applyFilters(); }, [applyFilters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Permanent deletion cannot be undone. Proceed?")) return;
    try {
      await apiRequest(`/queries/${id}`, "DELETE");
      setQueries((prev) => prev.filter((q) => q._id !== id));
    } catch { console.error("Delete failed"); }
  };

  const togglePin = async (id) => {
    try {
      await apiRequest(`/queries/${id}/pin`, "PATCH");
      setQueries((prev) => prev.map(q => 
        q._id === id ? { ...q, pinned: !q.pinned } : q
      ));
    } catch { console.error("Pinning failed"); }
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { console.error("Failed to copy text"); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="relative mb-6">
          <LoaderPulse />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Vault...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 w-fit">
            <Database size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enterprise Logs</span>
          </div>
          <h1 className="dashboard-heading text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
            Intelligence <span className="text-emerald-500">Vault</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl">
            Audit, retrieve, and manage your high-performance SQL generation history.
          </p>
        </div>
      </header>

      {/* --- CONTROLS --- */}
      <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-xl border border-slate-200 p-2 md:p-3 rounded-[28px] shadow-2xl shadow-slate-200/40 flex flex-col lg:flex-row items-center gap-4 transition-all focus-within:border-emerald-500/30">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="absolute left-5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search prompts or SQL architecture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 text-sm bg-transparent border-none focus:ring-0 placeholder:text-slate-400 font-medium"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto px-2 lg:px-0">
          <SelectWrapper icon={<Filter size={14} />} label="Context">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest border-none focus:ring-0 p-0 cursor-pointer w-full"
            >
              <option value="all">Global</option>
              <option value="generate">Generate</option>
              <option value="optimize">Optimize</option>
              <option value="validate">Validate</option>
              <option value="explain">Explain</option>
            </select>
          </SelectWrapper>

          <SelectWrapper icon={<ArrowUpDown size={14} />} label="Chronology">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest border-none focus:ring-0 p-0 cursor-pointer w-full"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Legacy</option>
            </select>
          </SelectWrapper>
        </div>
      </div>

      {/* --- CONTENT --- */}
      {filteredQueries.length === 0 ? (
        <div className="py-32 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm mb-6">
            <HistoryIcon className="text-slate-200" size={32} />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No logs retrieved</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {filteredQueries.map((q) => (
            <div
              key={q._id}
              className={`group bg-white border transition-all duration-500 rounded-[40px] overflow-hidden hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]
                ${q.pinned ? "border-amber-200 shadow-xl shadow-amber-500/5 bg-amber-50/20" : "border-slate-100 shadow-sm"}`}
            >
              <div className="p-6 md:p-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-slate-900 text-white shadow-lg">
                      <Code2 size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{q.mode}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                      <Calendar size={13} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {q.pinned && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                        <Pin size={10} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Priority Artifact</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                    {user?.plan === "pro" && (
                      <button
                        onClick={() => togglePin(q._id)}
                        className={`p-3 rounded-2xl transition-all shadow-sm ${q.pinned ? "bg-amber-100 text-amber-600 border border-amber-200" : "bg-white text-slate-400 border border-slate-100 hover:text-amber-500"}`}
                      >
                        {q.pinned ? <PinOff size={18} /> : <Pin size={18} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-3 bg-white text-slate-400 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all shadow-sm hover:border-rose-100"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>

                {/* Question */}
                <div className="flex items-start gap-5 mb-10">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                    <ChevronRight size={20} strokeWidth={3} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-snug tracking-tighter">
                    {q.prompt}
                  </h3>
                </div>

                {/* Code UI */}
                <div className="relative group/code">
                  {/* Terminal Header */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-slate-800/50 backdrop-blur-md rounded-t-[28px] flex items-center px-6 gap-2 border-b border-white/5 z-20">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    </div>
                  </div>
                  
                  <div className="absolute top-12 right-6 z-20">
                    <button
                      onClick={() => handleCopy(q._id, q.generatedSQL)}
                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl shadow-2xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 border
                        ${copiedId === q._id 
                          ? 'bg-emerald-500 text-white border-emerald-400' 
                          : 'bg-white/10 text-white border-white/10 backdrop-blur-md hover:bg-white/20'}`}
                    >
                      {copiedId === q._id ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === q._id ? 'Copied' : 'Sync Code'}</span>
                    </button>
                  </div>

                  <pre className="bg-[#020617] pt-16 pb-8 px-8 md:px-10 rounded-[32px] text-sm md:text-base text-emerald-100/90 font-mono overflow-x-auto leading-relaxed border border-slate-800 shadow-2xl">
                    <code className="block w-full">{q.generatedSQL}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="pt-20 pb-10 text-center">
        <div className="h-px w-24 bg-slate-200 mx-auto mb-6" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          End of Synchronized logs
        </p>
      </div>
    </div>
  );
}

/* --- SUB-COMPONENTS --- */

function SelectWrapper({ icon, label, children }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-2 bg-white border border-slate-200 rounded-2xl w-full sm:w-auto shadow-sm">
      <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function LoaderPulse() {
  return (
    <div className="relative flex h-16 w-16">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-3xl bg-emerald-400 opacity-20"></span>
      <div className="relative flex items-center justify-center rounded-3xl h-16 w-16 bg-emerald-50 text-emerald-600 border border-emerald-100">
        <HistoryIcon size={32} className="animate-pulse" />
      </div>
    </div>
  );
}
