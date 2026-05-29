import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
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
    accessStatus: user.accessStatus || "approved",
    activeWorkspace: user.activeWorkspace || null,
    dailyUsage: user.dailyUsage || 0
  };
};

const saveUserSession = (user) => {
  writeJson(STORAGE_KEYS.user, user);
};

const clearUserSession = () => {
  removeItems(STORAGE_KEYS.token, STORAGE_KEYS.user);
};

const delay = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));

const resolveClerkToken = async (getToken) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = await getToken({ skipCache: true });

    if (token) {
      return token;
    }

    await delay(200);
  }

  return null;
};

export function AuthProvider({ children }) {
  const {
    isLoaded: clerkLoaded,
    isSignedIn,
    getToken,
    orgId,
    signOut
  } = useClerkAuth();
  const [user, setUser] = useState(() => normalizeUser(readJson(STORAGE_KEYS.user)));
  const [loading, setLoading] = useState(true);
  const activeWorkspaceKey = orgId || "personal";

  const refreshCurrentUser = useCallback(
    async (fallbackUser = null) => {
      try {
        const clerkToken = isSignedIn ? await resolveClerkToken(getToken) : null;

        if (isSignedIn && !clerkToken) {
          throw new Error("Clerk session token is not ready yet");
        }

        const freshUser = normalizeUser(await authService.getCurrentUser(clerkToken));
        const workspaceUser = freshUser ? { ...freshUser, activeWorkspaceKey } : freshUser;
        saveUserSession(workspaceUser);
        setUser(workspaceUser);
        return workspaceUser;
      } catch (error) {
        if (fallbackUser) {
          return fallbackUser;
        }

        clearUserSession();
        setUser(null);
        throw error;
      }
    },
    [activeWorkspaceKey, getToken, isSignedIn]
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

    if (!clerkLoaded) {
      return () => {
        window.removeEventListener(API_AUTH_EVENT, handleAuthError);
      };
    }

    const loadUser = async () => {
      if (!isSignedIn) {
        clearUserSession();
        setUser(null);
        setLoading(false);
        return;
      }

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
  }, [clerkLoaded, isSignedIn, refreshCurrentUser]);

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
    clearUserSession();
    setUser(null);
    setLoading(false);

    try {
      await authService.logout();
    } catch {
      // Local cleanup should still happen if the network request fails.
    }

    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      window.location.assign("/");
    }
  }, [signOut]);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshCurrentUser }),
    [user, loading, login, logout, refreshCurrentUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
