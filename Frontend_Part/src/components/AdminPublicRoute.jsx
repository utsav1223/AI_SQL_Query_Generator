import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function AdminPublicRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) return <RouteLoadingScreen label="Preparing admin console..." />;
  if (admin) return <Navigate to="/admin/dashboard" replace />;

  return children;
}
