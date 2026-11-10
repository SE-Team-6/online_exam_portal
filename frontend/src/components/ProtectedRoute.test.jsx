import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

function renderGuardedRoute(allowedRoles = ["admin"]) {
  return render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route
          path="/private"
          element={(
            <ProtectedRoute allowedRoles={allowedRoles}>
              <h1>Private content</h1>
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/student" element={<h1>Student dashboard</h1>} />
        <Route path="/admin" element={<h1>Staff dashboard</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("ProtectedRoute", () => {
  it("redirects visitors without a session to login", () => {
    renderGuardedRoute();

    expect(screen.getByRole("heading", { name: "Login page" })).toBeInTheDocument();
  });

  it("allows a session with an allowed role", () => {
    sessionStorage.setItem("token", "test-token");
    sessionStorage.setItem("role", "admin");

    renderGuardedRoute();

    expect(screen.getByRole("heading", { name: "Private content" })).toBeInTheDocument();
  });

  it("redirects a student away from staff-only content", () => {
    sessionStorage.setItem("token", "test-token");
    sessionStorage.setItem("role", "student");

    renderGuardedRoute();

    expect(screen.getByRole("heading", { name: "Student dashboard" })).toBeInTheDocument();
  });
});
