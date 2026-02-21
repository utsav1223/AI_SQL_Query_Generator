import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { 
  User, Lock, CreditCard, Trash2, CheckCircle2, 
  AlertCircle, Loader2, ShieldCheck, ChevronRight, Sparkles,
  Key, Mail, Activity, ArrowUpRight
} from "lucide-react";

export default function Settings() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });
      const updatedUser = await apiRequest("/auth/update-profile", "PUT", { name });
      await login({ token: localStorage.getItem("token"), user: updatedUser });
      setMessage({ text: "Profile identity synchronized", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch {
      setMessage({ text: "Failed to update profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) return;
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });
      await apiRequest("/auth/change-password", "PUT", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage({ text: "Access keys updated successfully", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch {
      setMessage({ text: "Validation failed: Check credentials", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("Critical: This will purge all workspace data and history permanently. Continue?");
    if (!confirm) return;
    try {
      await apiRequest("/auth/delete-account", "DELETE");
      logout();
      window.location.href = "/";
    } catch {
      alert("Account termination failed");
    }
  };

  return (
    <div className="dashboard-page space-y-12 animate-in fade-in duration-1000">
      
      {/* --- PAGE HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-100">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 w-fit">
            <Activity size={14} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace Preferences</span>
          </div>
          <h1 className="dashboard-heading text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
            Account <span className="text-slate-400">Settings</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">Manage your identity, security protocols, and operational tier.</p>
        </div>
      </header>

      <div className="space-y-24">
        
        {/* --- PROFILE SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
              <User size={18} className="text-emerald-500" />
              Identity
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Global profile details used across the Intelligence platform.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
              <div className="p-8 md:p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Identity Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-6 py-4 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 opacity-70">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Authenticated Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 pl-12 pr-6 py-4 rounded-2xl text-sm text-slate-500 cursor-not-allowed font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/80 px-8 py-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="group flex items-center gap-3 bg-slate-950 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Save Profile <ChevronRight size={14} className="opacity-50 group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECURITY SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
              <Key size={18} className="text-blue-500" />
              Security
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Update your workspace access credentials to ensure operational security.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 md:p-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <input
                  type="password"
                  placeholder="Current Access Key"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:border-slate-300 transition-all"
                />
                <input
                  type="password"
                  placeholder="New Secure Key"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:border-slate-300 transition-all"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={loading || !newPassword}
                className="w-full bg-white border border-slate-200 hover:border-slate-800 text-slate-900 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:bg-slate-50"
              >
                Reset Credentials
              </button>
            </div>
          </div>
        </section>

        {/* --- SUBSCRIPTION SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
              <CreditCard size={18} className="text-purple-500" />
              Billing
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Operational capacity and subscription lifecycle management.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-slate-950 rounded-[40px] p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
              
              <div className="flex items-center gap-6 w-full relative z-10">
                <div className="bg-emerald-500/20 p-5 rounded-3xl border border-emerald-500/20 shadow-inner">
                  <Sparkles size={28} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Operational Tier</p>
                  <p className="text-2xl font-black text-white tracking-tight">
                    {user?.plan === "pro" ? "Pro Intelligence" : "Free Starter"}
                  </p>
                </div>
              </div>
              
              <div className="w-full sm:w-auto relative z-10">
                {user?.plan === "pro" ? (
                  <button disabled className="w-full sm:w-auto bg-white/5 border border-white/10 text-emerald-400 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest">
                    Subscribed
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate("/dashboard/pricing")}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    Upgrade <ArrowUpRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- DANGER ZONE --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-8 border-t border-slate-100">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-3">
              <AlertCircle size={18} />
              Termination
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Irreversible actions related to your permanent workspace record.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-rose-50/50 rounded-[32px] border border-rose-100 p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 group hover:bg-rose-50 transition-colors">
              <div className="space-y-2">
                <p className="text-lg font-black text-rose-900 tracking-tight">Purge Account Data</p>
                <p className="text-sm text-rose-600 font-medium opacity-80 max-w-sm leading-relaxed">
                  Permanently delete your profile, DDL schemas, and SQL history. This cannot be undone.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
              >
                <Trash2 size={16} /> Delete Forever
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* --- TOAST FEEDBACK --- */}
      {message.text && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-md">
          <div className="flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl text-white px-6 py-4 rounded-[24px] shadow-2xl border border-white/10 animate-in slide-in-from-bottom-10 duration-500">
            {message.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <AlertCircle size={20} className="text-rose-400" />}
            <span className="text-xs font-black uppercase tracking-[0.2em] flex-1">{message.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
