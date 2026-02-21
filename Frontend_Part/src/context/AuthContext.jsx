import { createContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "../services/api";

export const AuthContext = createContext();

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    _id: user._id || user.id,
    id: user.id || user._id,
    plan: user.plan || "free",
    dailyUsage: user.dailyUsage || 0
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return null;
    }

    const freshUser = await apiRequest("/auth/me", "GET");
    const normalized = normalizeUser(freshUser);
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
    return normalized;
  }, []);

  useEffect(() => {
    const init = async () => {
      const storedUserRaw = localStorage.getItem("user");
      if (storedUserRaw) {
        try {
          setUser(normalizeUser(JSON.parse(storedUserRaw)));
        } catch {
          localStorage.removeItem("user");
        }
      }

      try {
        await hydrateUser();
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [hydrateUser]);

  const login = useCallback(
    async (data) => {
      if (!data?.token) {
        throw new Error("Missing authentication token");
      }

      localStorage.setItem("token", data.token);

      const incomingUser = normalizeUser(data.user);
      if (incomingUser) {
        localStorage.setItem("user", JSON.stringify(incomingUser));
        setUser(incomingUser);
      }

      try {
        return await hydrateUser();
      } catch {
        if (incomingUser) {
          return incomingUser;
        }
        throw new Error("Failed to load account details");
      }
    },
    [hydrateUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
