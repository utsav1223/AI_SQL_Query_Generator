import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
      <p className="text-sm font-bold tracking-wide">
        {error || "Logging in..."}
      </p>
    </div>
  );
}
