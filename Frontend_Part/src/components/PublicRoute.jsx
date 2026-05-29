import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <RouteLoadingScreen label="Preparing sign in..." />;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
