import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { 
  BarChart3, 
  Layers, 
  Calendar, 
  Lock, 
  ArrowUpRight, 
  Loader2,
  Sparkles,
  Zap,
  Activity,
  ChevronRight,
  Target,
  TrendingUp
} from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#6366f1"];

export default function Analytics() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.plan !== "pro") return;

    const fetchAnalytics = async () => {
      try {
        const res = await apiRequest("/queries/advanced-analytics", "GET");
        setData(res);
      } catch (err) {
        console.error("Analytics Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  // --- LOADING STATE ---
  if (loading || (user?.plan === "pro" && isLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="relative flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500 relative z-10" size={48} strokeWidth={1.5} />
          <div className="absolute inset-0 blur-3xl bg-emerald-500/30 animate-pulse rounded-full" />
        </div>
        <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.5em] text-slate-500 transition-all">
          Initialising Neural Engine
        </p>
      </div>
    );
  }

  // --- PRO UPSELL ---
  if (!user || user.plan !== "pro") {
    return (
      <div className="dashboard-page">
        <div className="relative overflow-hidden bg-slate-950 rounded-[40px] p-8 md:p-24 border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 blur-[140px] rounded-full -mr-64 -mt-64" />
          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-10">
            <div className="inline-flex p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
              <Lock className="text-emerald-400" size={32} />
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-[1.05]">
              Unleash <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Advanced</span> <br /> Intelligence.
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
              Unlock query velocity tracking, tool efficiency heatmaps, and enterprise-grade growth metrics designed for high-performance teams.
            </p>
            <div className="pt-6">
              <button
                onClick={() => navigate("/dashboard/pricing")}
                className="group inline-flex items-center gap-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-12 py-6 rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-500/25 active:scale-95"
              >
                Upgrade to Pro <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DATA MAPPING ---
  const pieData = data?.modeStats?.map((item) => ({
    name: item._id || "Query",
    value: item.count
  })) || [];

  const lineData = data?.dailyStats?.map((item) => ({
    date: item._id,
    queries: item.count
  })) || [];

  return (
    <div className="dashboard-page space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-200/60">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 w-fit">
            <Activity size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">System Operational</span>
          </div>
          <h1 className="dashboard-heading text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Intelligence Hub</h1>
          <p className="text-slate-500 text-lg font-medium">Monitoring real-time performance and SQL velocity.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/50 hidden sm:flex">
          <div className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-200">24H Window</div>
          <div className="flex items-center gap-2 px-4 text-emerald-600">
            <Sparkles size={16} fill="currentColor" className="opacity-20" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Sync</span>
          </div>
        </div>
      </header>

      {/* PRIMARY KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
        <StatCard label="Total Operations" value={data?.totalQueries} trend="+14.2%" icon={<Layers />} />
        <StatCard label="Avg. Daily Load" value={Math.round(data?.totalQueries / (data?.dailyStats?.length || 1))} trend="Stable" icon={<Zap />} />
        <StatCard label="Operational Span" value={`${data?.dailyStats?.length || 0} Days`} trend="Active" icon={<Calendar />} />
      </div>

      {/* ANALYTICS VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* VELOCITY CHART */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[40px] p-8 md:p-12 shadow-sm hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-1">Activity Velocity</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Historical Query Volume</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 border border-slate-100"><BarChart3 size={20} /></div>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#64748b'}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                />
                <Area type="monotone" dataKey="queries" stroke="#10b981" strokeWidth={4} fill="url(#chartGradient)" animationDuration={1800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LOGIC DISTRIBUTION */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><Target size={180} /></div>
          
          <div className="relative z-10">
            <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Logic Distribution</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Mode Efficiency</p>
          </div>
          
          <div className="flex-1 min-h-[280px] relative z-10 my-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius="70%" outerRadius="90%" paddingAngle={10} stroke="none">
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 relative z-10">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {item.name}
                </div>
                <span className="text-white font-black">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECONDARY INSIGHTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <InsightCard title="Daily Avg Frequency" value={data?.avgPerDay} icon={<TrendingUp size={14} />} />
        <InsightCard title="Peak Operational Day" value={data?.peakDay?._id || "N/A"} />
        <InsightCard title="Most Active Tool" value={data?.mostActiveTool || "N/A"} />
        <InsightCard title="Velocity Growth" value={`${data?.growth || 0}%`} highlight={data?.growth > 0} />
        <InsightCard title="Efficiency Score" value={`${data?.optimizerUsagePercent || 0}%`} />
        <InsightCard title="User Tier Status" value={data?.userLevel || "Standard"} highlight />
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ label, value, trend, icon }) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-[36px] hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 group relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 group-hover:scale-110 transition-all duration-500 border border-slate-100">
          {icon && typeof icon === 'object' ? Object.assign({}, icon, { props: { ...icon.props, size: 24 } }) : icon}
        </div>
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50/50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100/50">
          {trend}
        </span>
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 relative z-10">{label}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tight relative z-10">{value?.toLocaleString() || '0'}</p>
    </div>
  );
}

function InsightCard({ title, value, highlight, icon }) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-[32px] flex flex-col justify-between hover:border-slate-300 hover:shadow-xl transition-all duration-300 group cursor-default">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</h4>
        {icon && <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-2xl font-black tracking-tight ${highlight ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</p>
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 border border-slate-100 group-hover:border-emerald-400">
            <ChevronRight size={18} className="text-slate-300 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  );
}
