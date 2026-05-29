import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "../context/AuthContext";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false
  })
}));

const renderProtectedRoute = ({ user = null, accountRestriction = null, loading = false, loggingOut = false, roles } = {}) => {
  return render(
    <AuthContext.Provider value={{ user, accountRestriction, loading, loggingOut, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={roles}>
                <div>Private dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<div>Public home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("ProtectedRoute", () => {
  it("shows a loading screen while auth is restoring", () => {
    renderProtectedRoute({ loading: true });

    expect(screen.getByText("Securing your workspace...")).toBeInTheDocument();
  });

  it("shows a signing out screen while logout is in progress", () => {
    renderProtectedRoute({ loggingOut: true });

    expect(screen.getByText("Signing out...")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    renderProtectedRoute();

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    renderProtectedRoute({ user: { id: "user-1", role: "user" } });

    expect(screen.getByText("Private dashboard")).toBeInTheDocument();
  });

  it("redirects authenticated users without the required role", () => {
    renderProtectedRoute({
      user: { id: "user-1", role: "user" },
      roles: ["admin"]
    });

    expect(screen.getByText("Public home")).toBeInTheDocument();
  });

  it("shows the admin moderation message for restricted accounts", () => {
    renderProtectedRoute({
      accountRestriction: {
        status: "suspended",
        title: "Account suspended",
        message: "Your account has been suspended. Reason: Payment abuse",
        reason: "Payment abuse"
      }
    });

    expect(screen.getByText("Account suspended")).toBeInTheDocument();
    expect(screen.getByText("Admin Message")).toBeInTheDocument();
    expect(screen.getByText("Payment abuse")).toBeInTheDocument();
    expect(screen.getByText("Contact Admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send review request/i })).toBeInTheDocument();
  });
});
