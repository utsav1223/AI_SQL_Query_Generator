import { createContext, useCallback, useEffect, useState } from "react";
import { adminApiRequest, ADMIN_STORAGE_KEYS } from "../services/adminApi";

export const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_STORAGE_KEYS.token);
    localStorage.removeItem(ADMIN_STORAGE_KEYS.admin);
    setAdmin(null);
  }, []);

  const hydrateAdmin = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_STORAGE_KEYS.token);
    if (!token) {
      setAdmin(null);
      return null;
    }

    const me = await adminApiRequest("/admin/me", "GET");
    localStorage.setItem(ADMIN_STORAGE_KEYS.admin, JSON.stringify(me));
    setAdmin(me);
    return me;
  }, []);

  useEffect(() => {
    const init = async () => {
      const cachedAdmin = localStorage.getItem(ADMIN_STORAGE_KEYS.admin);
      if (cachedAdmin) {
        try {
          setAdmin(JSON.parse(cachedAdmin));
        } catch {
          localStorage.removeItem(ADMIN_STORAGE_KEYS.admin);
        }
      }

      try {
        await hydrateAdmin();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [hydrateAdmin, logout]);

  const login = useCallback(async (credentials) => {
    const data = await adminApiRequest("/admin/login", "POST", credentials);
    if (!data?.token || !data?.admin) {
      throw new Error("Invalid admin login response");
    }

    localStorage.setItem(ADMIN_STORAGE_KEYS.token, data.token);
    localStorage.setItem(ADMIN_STORAGE_KEYS.admin, JSON.stringify(data.admin));
    setAdmin(data.admin);
    return data.admin;
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
