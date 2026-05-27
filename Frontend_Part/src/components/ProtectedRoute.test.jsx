import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "../context/AuthContext";

const renderProtectedRoute = ({ user = null, loading = false, roles } = {}) => {
  return render(
    <AuthContext.Provider value={{ user, loading, login: vi.fn(), logout: vi.fn() }}>
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

    expect(screen.getByText("Restoring secure session...")).toBeInTheDocument();
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
});
