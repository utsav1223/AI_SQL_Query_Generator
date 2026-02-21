import { Navigate, useLocation } from "react-router-dom";

export default function ResetRouteGuard({ children }) {
  const location = useLocation();

  const emailFromState = location.state?.email;

  // If no email passed from forgot-password page
  if (!emailFromState) {
    return <Navigate to="/forgot-password" replace />;
  }

  return children;
}
