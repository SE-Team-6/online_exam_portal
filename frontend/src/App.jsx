import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
  return <h1>Admin Dashboard</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<Student />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;