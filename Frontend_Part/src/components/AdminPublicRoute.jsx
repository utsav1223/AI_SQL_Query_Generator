import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AdminAuthContext } from "../context/AdminAuthContext";

export default function AdminPublicRoute({ children }) {
  const { admin, loading } = useContext(AdminAuthContext);

  if (loading) return null;
  if (admin) return <Navigate to="/admin/dashboard" replace />;

  return children;
}
