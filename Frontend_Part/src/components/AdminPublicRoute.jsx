import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AdminAuthContext } from "../context/AdminAuthContext";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function AdminPublicRoute({ children }) {
  const { admin, loading } = useContext(AdminAuthContext);

  if (loading) return <RouteLoadingScreen label="Preparing admin console..." />;
  if (admin) return <Navigate to="/admin/dashboard" replace />;

  return children;
}
