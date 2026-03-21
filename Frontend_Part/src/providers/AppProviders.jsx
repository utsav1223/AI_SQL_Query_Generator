import { ThemeProvider } from "../context/ThemeContext";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { AuthProvider } from "../context/AuthContext";

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <AuthProvider>{children}</AuthProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
