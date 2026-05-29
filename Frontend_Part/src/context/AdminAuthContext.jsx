import { createContext, useEffect, useState } from "react";
import { adminService } from "../services/adminService";
import { API_AUTH_EVENT } from "../services/httpClient";
import { STORAGE_KEYS, readJson, removeItems, writeJson } from "../utils/storage";

export const AdminAuthContext = createContext(null);

const clearAdminSession = () => {
  removeItems(STORAGE_KEYS.adminToken, STORAGE_KEYS.admin);
};

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => readJson(STORAGE_KEYS.admin));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail?.authScope !== "admin") {
        return;
      }

      clearAdminSession();
      setAdmin(null);
    };

    window.addEventListener(API_AUTH_EVENT, handleAuthError);

    const loadAdmin = async () => {
      try {
        const freshAdmin = await adminService.getCurrentAdmin();
        writeJson(STORAGE_KEYS.admin, freshAdmin);
        setAdmin(freshAdmin);
      } catch {
        clearAdminSession();
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();

    return () => {
      window.removeEventListener(API_AUTH_EVENT, handleAuthError);
    };
  }, []);

  const login = async (credentials) => {
    const data = await adminService.login(credentials);

    if (!data?.admin) {
      throw new Error("Invalid admin login response");
    }

    if (data.token) {
      writeJson(STORAGE_KEYS.adminToken, data.token);
    }

    writeJson(STORAGE_KEYS.admin, data.admin);
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = async () => {
    try {
      await adminService.logout();
    } catch {
      // Local cleanup should still happen if the network request fails.
    }

    clearAdminSession();
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
