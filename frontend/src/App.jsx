
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import QuestionBank from "./pages/QuestionBank";

function Login() {
  return <h1>Login Page</h1>;
}

function Register() {
  return <h1>Register Page</h1>;
}

function Student() {
  return <h1>Student Dashboard</h1>;
}

function Admin() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>
        <a href="/question-bank">Manage Question Bank</a>
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Student />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "instructor"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Temporary local preview — remove before submitting the PR */}
        <Route
          path="/question-bank-preview"
          element={<QuestionBank />}
        />

        {/* Protected route for actual use */}
        <Route
          path="/question-bank"
          element={
            <ProtectedRoute allowedRoles={["admin", "instructor"]}>
              <QuestionBank />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
