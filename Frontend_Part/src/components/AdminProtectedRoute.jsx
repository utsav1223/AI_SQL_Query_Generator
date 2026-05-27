import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) return <RouteLoadingScreen label="Validating admin session..." />;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location }} />;

  return children;
}
