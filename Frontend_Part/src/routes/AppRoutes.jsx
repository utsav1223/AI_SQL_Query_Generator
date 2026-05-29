import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import AdminProtectedRoute from "../components/AdminProtectedRoute";
import AdminPublicRoute from "../components/AdminPublicRoute";
import Seo from "../components/Seo";
import RouteLoadingScreen from "../components/ui/RouteLoadingScreen";

const Landing = lazy(() => import("../pages/Landing"));
const Developers = lazy(() => import("../pages/Developers"));
const BillingSuccess = lazy(() => import("../pages/BillingSuccess"));
const DashboardLayout = lazy(() => import("../components/layout/DashboardLayout"));
const Overview = lazy(() => import("../pages/dashboard/Overview"));
const Generate = lazy(() => import("../pages/dashboard/Generate"));
const History = lazy(() => import("../pages/dashboard/History"));
const Analytics = lazy(() => import("../pages/dashboard/Analytics"));
const Settings = lazy(() => import("../pages/dashboard/Settings"));
const Support = lazy(() => import("../pages/dashboard/Support"));
const FAQ = lazy(() => import("../pages/dashboard/FAQ"));
const Feedback = lazy(() => import("../pages/dashboard/Feedback"));
const Schema = lazy(() => import("../pages/dashboard/Schema"));
const DashboardBilling = lazy(() => import("../pages/dashboard/Pricing"));
const Invoices = lazy(() => import("../pages/dashboard/Invoices"));
const AdminLogin = lazy(() => import("../pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingScreen label="Preparing workspace..." />}>
      <Seo />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/developers" element={<Developers />} />
        <Route
          path="/forgot-password"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/billing"
          element={<Navigate to="/dashboard/billing" replace />}
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
              <Landing />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />

        <Route
          path="/reset-with-otp"
          element={<Navigate to="/login" replace />}
        />

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
          <Route path="billing" element={<DashboardBilling />} />
          <Route path="pricing" element={<Navigate to="/dashboard/billing" replace />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="support" element={<Support />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
