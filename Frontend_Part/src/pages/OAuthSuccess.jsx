import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { logger } from "../utils/logger";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const completeOAuthLogin = async () => {
      try {
        await login({});
        navigate("/dashboard", { replace: true });
      } catch (err) {
        logger.error("OAuth login failed", err);
        setError("OAuth login failed");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    };

    completeOAuthLogin();
  }, [login, navigate]);

  return (
    <div className="public-page px-6 py-10">
      <div className="public-card mx-auto flex w-full max-w-lg flex-col items-center rounded-3xl p-10 text-center">
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
              Finishing sign-in...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
