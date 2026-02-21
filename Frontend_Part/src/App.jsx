import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Developers from "./pages/Developers";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OAuthSuccess from "./pages/OAuthSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetWithOTP from "./pages/ResetWithOTP";

import ProtectedRoute from "./components/ProtectedRoute";
import ResetRouteGuard from "./components/ResetRouteGuard";
import PublicRoute from "./components/PublicRoute";

import DashboardLayout from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Generate from "./pages/dashboard/Generate";
import History from "./pages/dashboard/History";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import Support from "./pages/dashboard/Support";
import FAQ from "./pages/dashboard/FAQ";
import Feedback from "./pages/dashboard/Feedback";

import Schema from "./pages/dashboard/Schema";
import Pricing from "./pages/dashboard/Pricing";

import Billing from "./pages/Billing";
import BillingSuccess from "./pages/BillingSuccess";
import Invoices from "./pages/dashboard/Invoices";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminPublicRoute from "./components/AdminPublicRoute";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route path="/billing/success" element={<BillingSuccess />} />
        <Route path="/billingsuccess" element={<BillingSuccess />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/feedback" element={<Navigate to="/dashboard/feedback" replace />} />
        <Route path="/faq" element={<Navigate to="/dashboard/faq" replace />} />
        <Route path="/support" element={<Navigate to="/dashboard/support" replace />} />

        <Route
          path="/admin/login"
          element={
            <AdminPublicRoute>
              <AdminLogin />
            </AdminPublicRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/reset-with-otp"
          element={
            <ResetRouteGuard>
              <ResetWithOTP />
            </ResetRouteGuard>
          }
        />

        {/* Dashboard Section */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="generate" element={<Generate />} />
          <Route path="schema" element={<Schema />} />
          <Route path="history" element={<History />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="support" element={<Support />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
