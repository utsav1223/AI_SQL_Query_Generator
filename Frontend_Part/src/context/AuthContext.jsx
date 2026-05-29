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

const ACCOUNT_RESTRICTION_CODES = new Set([
  "ACCOUNT_DELETED",
  "ACCOUNT_REJECTED",
  "ACCOUNT_SUSPENDED",
  "WAITLIST_PENDING"
]);

const normalizeAccountRestriction = (restriction) => {
  if (!restriction) {
    return null;
  }

  return {
    code: restriction.code || "",
    status: restriction.status || "blocked",
    title: restriction.title || "Account access blocked",
    message: restriction.message || "This account cannot open the workspace.",
    reason: restriction.reason || "",
    action: restriction.action || "",
    createdAt: restriction.createdAt || null
  };
};

const getRestrictionFromError = (error) => {
  const restriction = normalizeAccountRestriction(error?.data?.accountRestriction);

  if (restriction) {
    return restriction;
  }

  if (ACCOUNT_RESTRICTION_CODES.has(error?.code)) {
    return normalizeAccountRestriction({
      code: error.code,
      message: error.message
    });
  }

  return null;
};

const saveUserSession = (user) => {
  writeJson(STORAGE_KEYS.user, user);
};

const clearUserSession = () => {
  removeItems(STORAGE_KEYS.token, STORAGE_KEYS.user);
};

const saveAccountRestriction = (restriction) => {
  writeJson(STORAGE_KEYS.accountRestriction, restriction);
};

const clearAccountRestriction = () => {
  removeItems(STORAGE_KEYS.accountRestriction);
};

const clearAuthSession = () => {
  removeItems(STORAGE_KEYS.token, STORAGE_KEYS.user, STORAGE_KEYS.accountRestriction);
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
  const [accountRestriction, setAccountRestriction] = useState(() =>
    normalizeAccountRestriction(readJson(STORAGE_KEYS.accountRestriction))
  );
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
        clearAccountRestriction();
        setUser(workspaceUser);
        setAccountRestriction(null);
        return workspaceUser;
      } catch (error) {
        const restriction = getRestrictionFromError(error);

        if (restriction) {
          clearUserSession();
          saveAccountRestriction(restriction);
          setUser(null);
          setAccountRestriction(restriction);
          return null;
        }

        if (fallbackUser) {
          return fallbackUser;
        }

        clearAuthSession();
        setUser(null);
        setAccountRestriction(null);
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

      const restriction =
        normalizeAccountRestriction(event.detail?.accountRestriction || event.detail?.data?.accountRestriction) ||
        (ACCOUNT_RESTRICTION_CODES.has(event.detail?.code)
          ? normalizeAccountRestriction({
              code: event.detail.code,
              message: event.detail.message
            })
          : null);

      clearUserSession();
      setUser(null);

      if (restriction) {
        saveAccountRestriction(restriction);
        setAccountRestriction(restriction);
      } else {
        clearAccountRestriction();
        setAccountRestriction(null);
      }
    };

    window.addEventListener(API_AUTH_EVENT, handleAuthError);

    if (!clerkLoaded) {
      return () => {
        window.removeEventListener(API_AUTH_EVENT, handleAuthError);
      };
    }

    const loadUser = async () => {
      if (!isSignedIn) {
        clearAuthSession();
        setUser(null);
        setAccountRestriction(null);
        setLoading(false);
        return;
      }

      try {
        await refreshCurrentUser();
      } catch {
        clearAuthSession();
        setUser(null);
        setAccountRestriction(null);
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
        clearAccountRestriction();
        setUser(incomingUser);
        setAccountRestriction(null);
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
    clearAuthSession();
    setUser(null);
    setAccountRestriction(null);
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
    () => ({ user, accountRestriction, loading, login, logout, refreshCurrentUser }),
    [user, accountRestriction, loading, login, logout, refreshCurrentUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
