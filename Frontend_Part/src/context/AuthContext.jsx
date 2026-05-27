import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { API_AUTH_EVENT } from "../services/httpClient";
import { STORAGE_KEYS, readJson, removeItems, writeJson } from "../utils/storage";

export const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    _id: user._id || user.id,
    id: user.id || user._id,
    plan: user.plan || "free",
    dailyUsage: user.dailyUsage || 0
  };
};

const saveUserSession = (user) => {
  writeJson(STORAGE_KEYS.user, user);
};

const clearUserSession = () => {
  removeItems(STORAGE_KEYS.token, STORAGE_KEYS.user);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => normalizeUser(readJson(STORAGE_KEYS.user)));
  const [loading, setLoading] = useState(true);

  const refreshCurrentUser = useCallback(
    async (fallbackUser = null) => {
      try {
        const freshUser = normalizeUser(await authService.getCurrentUser());
        saveUserSession(freshUser);
        setUser(freshUser);
        return freshUser;
      } catch (error) {
        if (fallbackUser) {
          return fallbackUser;
        }

        clearUserSession();
        setUser(null);
        throw error;
      }
    },
    []
  );

  useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail?.authScope !== "user") {
        return;
      }

      clearUserSession();
      setUser(null);
    };

    window.addEventListener(API_AUTH_EVENT, handleAuthError);

    const loadUser = async () => {
      try {
        await refreshCurrentUser();
      } catch {
        clearUserSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      window.removeEventListener(API_AUTH_EVENT, handleAuthError);
    };
  }, [refreshCurrentUser]);

  const login = useCallback(
    async (data) => {
      const incomingUser = normalizeUser(data.user);

      if (incomingUser) {
        saveUserSession(incomingUser);
        setUser(incomingUser);
        setLoading(false);
        return incomingUser;
      }

      setLoading(false);

      try {
        return await refreshCurrentUser();
      } catch {
        throw new Error("Failed to load account details");
      }
    },
    [refreshCurrentUser]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Local cleanup should still happen if the network request fails.
    }

    clearUserSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
