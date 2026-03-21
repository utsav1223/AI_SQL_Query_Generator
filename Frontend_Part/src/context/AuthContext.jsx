import { createContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
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

const saveUserSession = (token, user) => {
  localStorage.setItem(STORAGE_KEYS.token, token);
  writeJson(STORAGE_KEYS.user, user);
};

const clearUserSession = () => {
  removeItems(STORAGE_KEYS.token, STORAGE_KEYS.user);
};

const syncCurrentUserSession = async (token, setUser, fallbackUser = null) => {
  try {
    const freshUser = normalizeUser(await authService.getCurrentUser());
    saveUserSession(token, freshUser);
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
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => normalizeUser(readJson(STORAGE_KEYS.user)));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.token);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await syncCurrentUserSession(token, setUser);
      } catch {
        clearUserSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (data) => {
    if (!data?.token) {
      throw new Error("Missing authentication token");
    }

    const incomingUser = normalizeUser(data.user);

    if (incomingUser) {
      saveUserSession(data.token, incomingUser);
      setUser(incomingUser);
      setLoading(false);

      syncCurrentUserSession(data.token, setUser, incomingUser).catch(() => {});
      return incomingUser;
    }

    localStorage.setItem(STORAGE_KEYS.token, data.token);
    setLoading(false);

    try {
      return await syncCurrentUserSession(data.token, setUser);
    } catch {
      throw new Error("Failed to load account details");
    }
  };

  const logout = () => {
    clearUserSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
