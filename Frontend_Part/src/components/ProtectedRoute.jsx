import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoadingScreen label="Restoring secure session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
