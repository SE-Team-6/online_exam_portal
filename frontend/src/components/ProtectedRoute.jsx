import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === "student") {
      return <Navigate to="/student" replace />;
    }

    if (role === "admin" || role === "instructor") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;