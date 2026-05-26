import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  Shield,
  Trash2,
  User
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";

export default function Settings() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleProfileUpdate = async () => {
    try {
      setProfileLoading(true);
      setMessage({ text: "", type: "" });
      const updatedUser = await authService.updateProfile({ name });
      await login({ token: localStorage.getItem("token"), user: updatedUser });
      setMessage({ text: "Profile updated successfully.", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch {
      setMessage({ text: "Failed to update profile.", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      return;
    }

    try {
      setPasswordLoading(true);
      setMessage({ text: "", type: "" });
      await authService.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage({ text: "Password changed successfully.", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch {
      setMessage({ text: "Failed to change password.", type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteLoading) {
      return;
    }

    const confirmed = window.confirm(
      "This will permanently delete your account, schema data, and query history. Continue?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(true);
      await authService.deleteAccount();
      logout();
      window.location.href = "/";
    } catch {
      setMessage({ text: "Failed to delete account.", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-card rounded-lg p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
          Settings
        </p>
        <h1 className="dashboard-heading mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
          Manage your account
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-400">
          Update your profile, change your password, and manage billing or account deletion from one simple page.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="dashboard-card rounded-lg p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
              <User size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">Profile</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Basic account information</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Full Name">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input-control rounded-md px-4 py-3 text-sm font-semibold"
              />
            </Field>

            <Field label="Email">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="input-control rounded-md py-3 pl-11 pr-4 text-sm font-semibold opacity-80"
                />
              </div>
            </Field>

            <button
              type="button"
              onClick={handleProfileUpdate}
              disabled={profileLoading}
              className="button-primary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {profileLoading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </section>

        <section className="dashboard-card rounded-lg p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
              <Shield size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">Security</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Change your password</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Current Password">
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                className="input-control rounded-md px-4 py-3 text-sm font-semibold"
              />
            </Field>

            <Field label="New Password">
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                className="input-control rounded-md px-4 py-3 text-sm font-semibold"
              />
            </Field>

            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={passwordLoading || !currentPassword || !newPassword}
              className="button-secondary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {passwordLoading ? "Updating..." : "Change Password"}
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="dashboard-card rounded-lg p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
              <CreditCard size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">Billing</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current subscription status</p>
            </div>
          </div>

          <div className="surface-card-soft rounded-lg p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Current Plan
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">
              {user?.plan === "pro" ? "Professional" : "Free"}
            </p>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
              {user?.plan === "pro"
                ? "Your account has access to advanced tools and billing history."
                : "Upgrade to unlock analytics and advanced SQL tools."}
            </p>

            {user?.plan === "pro" ? (
              <button
                type="button"
                onClick={() => navigate("/dashboard/invoices")}
                className="button-secondary mt-5 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
              >
                View Invoices
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/dashboard/pricing")}
                className="button-primary mt-5 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        </section>

        <section className="dashboard-card rounded-lg border-rose-200 p-5 dark:border-rose-900/40 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--danger-soft)] text-[var(--danger)]">
              <Trash2 size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-100">Delete Account</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">This action cannot be undone</p>
            </div>
          </div>

          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20 sm:p-5">
            <p className="text-sm font-medium leading-7 text-rose-700 dark:text-rose-300">
              Deleting your account permanently removes profile data, saved schema, and query history.
            </p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="button-danger mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deleteLoading ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </section>
      </div>

      {message.text ? (
        <div className="fixed bottom-6 left-1/2 z-[100] w-full max-w-md -translate-x-1/2 px-4">
          <div className="surface-inverse flex items-center gap-3 rounded-lg px-5 py-4 shadow-xl">
            {message.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <AlertCircle size={18} className="text-rose-400" />
            )}
            <p className="text-sm font-semibold">{message.text}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}
