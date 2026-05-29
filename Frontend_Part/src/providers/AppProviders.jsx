import { ThemeProvider } from "../context/ThemeContext";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { AuthProvider } from "../context/AuthContext";
import ClerkTokenBridge from "../components/ClerkTokenBridge";

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <ClerkTokenBridge />
        <AuthProvider>{children}</AuthProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
