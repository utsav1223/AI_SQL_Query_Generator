import { createContext, useEffect, useState } from "react";
import { adminService } from "../services/adminService";
import { STORAGE_KEYS, readJson, removeItems, writeJson } from "../utils/storage";

export const AdminAuthContext = createContext(null);

const clearAdminSession = () => {
  removeItems(STORAGE_KEYS.adminToken, STORAGE_KEYS.admin);
};

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => readJson(STORAGE_KEYS.admin));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmin = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);

      if (!token) {
        setLoading(false);
        return;
      }

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
  }, []);

  const login = async (credentials) => {
    const data = await adminService.login(credentials);

    if (!data?.token || !data?.admin) {
      throw new Error("Invalid admin login response");
    }

    localStorage.setItem(STORAGE_KEYS.adminToken, data.token);
    writeJson(STORAGE_KEYS.admin, data.admin);
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = () => {
    clearAdminSession();
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
