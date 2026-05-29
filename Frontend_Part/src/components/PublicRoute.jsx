import { Navigate } from "react-router-dom";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useAuth } from "../hooks/useAuth";
import RouteLoadingScreen from "./ui/RouteLoadingScreen";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();

  if (loading || !clerkLoaded) return <RouteLoadingScreen label="Preparing sign in..." />;

  if (user || isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
