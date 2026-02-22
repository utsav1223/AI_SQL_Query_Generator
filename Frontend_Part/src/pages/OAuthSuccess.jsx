import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [error, setError] = useState("");

  const token = useMemo(() => params.get("token"), [params]);
  const userParam = useMemo(() => params.get("user"), [params]);

  useEffect(() => {
    const completeOAuthLogin = async () => {
      if (!token) {
        setError("Missing OAuth token");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
        return;
      }

      try {
        let user = null;
        if (userParam) {
          user = JSON.parse(decodeURIComponent(userParam));
        }

        await login({ token, user });
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("OAuth login failed:", err);
        setError("OAuth login failed");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    };

    completeOAuthLogin();
  }, [login, navigate, token, userParam]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        {error ? (
          <>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-500">OAuth Failed</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{error}</p>
          </>
        ) : (
          <>
            <div className="relative">
              <Loader2 className="animate-spin text-emerald-500" size={36} />
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl" />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Completing secure sign-in...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
