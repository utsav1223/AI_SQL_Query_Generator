import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function PublicRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <RouteLoadingScreen label="Checking authentication..." />;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
