import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, Activity, Calendar, Wrench, Clock,
  AlertTriangle, Zap, TrendingUp, ChevronRight, Sparkles
} from "lucide-react"; 

export default function Overview() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const freeCreditsLimit = stats?.freeCreditsLimit ?? stats?.dailyLimit ?? 5;
  const freeCreditsUsed = stats?.freeCreditsUsed ?? stats?.usedToday ?? (user?.dailyUsage || 0);
  const remainingCredits = Math.max(
    stats?.remainingCredits ?? stats?.remainingToday ?? (freeCreditsLimit - freeCreditsUsed),
    0
  );
  const limitReached = user?.plan === "free" && freeCreditsUsed >= freeCreditsLimit;

  let expiryWarning = null;
  let isExpired = false;
  let daysLeft = null;

  if (user?.plan === "pro" && user?.billingRenewal) {
    const today = new Date();
    const renewal = new Date(user.billingRenewal);
    today.setHours(0, 0, 0, 0);
    renewal.setHours(0, 0, 0, 0);
    const diffTime = renewal - today;
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      isExpired = true;
      expiryWarning = "Subscription expired. Services paused.";
    } else if (daysLeft <= 3) {
      expiryWarning = `Subscription renewal in ${daysLeft} day${daysLeft > 1 ? "s" : ""}.`;
    }
  }

  useEffect(() => {
    let isActive = true;

    const fetchStats = async () => {
      try {
        const data = await apiRequest("/queries/overview", "GET");
        if (isActive) {
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();

    return () => {
      isActive = false;
    };
  }, [user?._id, user?.plan]);

  if (!stats) return <OverviewSkeleton />;

  const modeStats = stats.modeStats || [];
  const recentQueries = stats.recentQueries || [];
  const totalModeUsage = modeStats.reduce((sum, m) => sum + m.count, 0);
  const mostUsedTool = modeStats.length > 0
      ? modeStats.reduce((max, m) => (m.count > max.count ? m : max))._id
      : "N/A";

  return (
    <div className="dashboard-page space-y-8 font-sans antialiased text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* --- REFINED HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tighter">Workspace</span>
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {user?._id?.slice(-6)}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            Welcome back, <span className="text-emerald-500">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 font-medium">Your operational summary for the last 24 hours.</p>
        </div>

        {user?.plan === "pro" && !isExpired && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Pro System Live</span>
          </div>
        )}
      </header>

      {/* --- CRITICAL NOTIFICATIONS --- */}
      {(limitReached || expiryWarning) && (
        <div className="grid grid-cols-1 gap-4 animate-in zoom-in-95 duration-500">
          {limitReached && (
            <div className="group relative overflow-hidden bg-slate-900 rounded-3xl p-6 shadow-2xl shadow-emerald-900/10 transition-all hover:scale-[1.01]">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/40">
                    <Zap size={28} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg leading-tight">Free credits exhausted.</h4>
                    <p className="text-slate-400 text-sm font-medium">You have used all 5 free credits. Upgrade to Pro to continue generating SQL.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/dashboard/pricing")}
                  className="w-full md:w-auto bg-white text-slate-950 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-400 transition-all active:scale-95 shadow-xl"
                >
                  Upgrade Intelligence
                </button>
              </div>
            </div>
          )}

          {expiryWarning && (
            <div className={`border-l-4 ${isExpired ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50'} p-4 rounded-r-2xl flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className={isExpired ? 'text-red-500' : 'text-amber-500'} />
                <span className={`text-sm font-bold ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>{expiryWarning}</span>
              </div>
              <button onClick={() => navigate("/dashboard/pricing")} className="text-xs font-black uppercase underline tracking-tighter">Renew</button>
            </div>
          )}
        </div>
      )}

      {/* --- MAIN KPI CARDS --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Volume" value={stats.totalQueries} icon={<BarChart3 />} color="bg-blue-50 text-blue-600" />
        <StatCard title="24h Velocity" value={stats.todayQueries} icon={<Activity />} color="bg-emerald-50 text-emerald-600" />
        
        {user?.plan === "pro" ? (
          <StatCard 
            title="Account Life" 
            value={isExpired ? 0 : daysLeft} 
            suffix=" Days"
            icon={<Clock />} 
            color={daysLeft <= 3 ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-600"} 
          />
        ) : (
          <StatCard 
            title="Available" 
            value={remainingCredits} 
            suffix=" Credits"
            icon={<Calendar />} 
            color={remainingCredits <= 5 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"} 
          />
        )}
        
        <StatCard title="Dominant Tool" value={mostUsedTool} icon={<Wrench />} color="bg-orange-50 text-orange-600" isCaps />
      </section>

      {/* --- SECONDARY ANALYTICS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LOGIC DISTRIBUTION */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs">Resource Allocation</h3>
            <TrendingUp size={16} className="text-slate-300 dark:text-slate-500" />
          </div>

          {(user?.plan === "pro" && !isExpired) ? (
            <div className="space-y-8">
              {modeStats.map((mode) => {
                const percent = totalModeUsage > 0 ? ((mode.count / totalModeUsage) * 100).toFixed(0) : 0;
                const progressWidth = mode.count > 0 ? Math.max(Number(percent), 4) : 0;
                return (
                  <div key={mode._id} className="group">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 mb-3 group-hover:text-slate-600 dark:group-hover:text-slate-100 transition-colors">
                      <span>{mode._id}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ring-1 ring-slate-200/70 dark:ring-slate-500/70">
                      <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-1000 group-hover:bg-emerald-400 dark:group-hover:bg-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.45)] dark:shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Zap size={24} className="text-slate-200" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                Upgrade to unlock advanced insights
              </p>
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY TABLE */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Recent Operations</h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:tracking-[0.25em] transition-all">Export Logs</button>
          </div>

          <div className="overflow-hidden">
            <div className="grid grid-cols-1 gap-2">
              {recentQueries.length > 0 ? (
                recentQueries.map((q) => (
                  <div key={q._id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4 truncate">
                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-emerald-500 transition-all font-bold text-[10px] uppercase">
                        {q.mode?.slice(0,2)}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-800 truncate">{q.prompt}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{q.mode} | 0.4s Latency</p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        {new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-2">
                  <p className="text-slate-400 font-medium italic">No activity logs found for this period.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE STAT CARD COMPONENT ---
function StatCard({ title, value, suffix = "", icon, color, isCaps }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-2xl ${color} transition-transform group-hover:scale-110 duration-500`}>
          {icon && typeof icon === 'object' ? Object.assign({}, icon, { props: { ...icon.props, size: 20 } }) : icon}
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-400 transition-colors" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-black tracking-tight text-slate-900 ${isCaps ? 'capitalize text-2xl' : ''}`}>
            {value ?? 0}
          </span>
          {suffix && <span className="text-xs font-bold text-slate-400">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-pulse">
      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div className="space-y-3"><div className="h-8 w-64 bg-slate-100 rounded-xl" /><div className="h-4 w-40 bg-slate-50 rounded-lg" /></div>
        <div className="h-12 w-32 bg-slate-100 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-36 bg-slate-50 rounded-[2rem]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-80 bg-slate-50 rounded-[2.5rem]" />
        <div className="lg:col-span-2 h-80 bg-slate-50 rounded-[2.5rem]" />
      </div>
    </div>
  );
}
