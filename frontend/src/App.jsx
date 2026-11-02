
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { apiRequest } from "./services/api";
import { startAttempt } from "./services/attemptService";
import ProtectedRoute from "./components/ProtectedRoute";
import QuestionBank from "./pages/QuestionBank";
import StudentExam from "./pages/StudentExam";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const token = data.token ?? data.accessToken;
      const role = String(data.role ?? data.user?.role ?? "").toLowerCase();

      if (!token || !["student", "admin", "instructor"].includes(role)) {
        throw new Error("The server response is missing a valid token or role.");
      }

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("role", role);

      navigate(role === "student" ? "/student" : "/admin", {
        replace: true,
      });
    } catch (err) {
      if (err.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.status === 423) {
        setError("Your account is locked. Please contact the administrator.");
      } else {
        setError(err.message || "Unable to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      setSuccess("Registration successful. You can now log in.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-name">Full name</label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}

function Student() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingExamId, setStartingExamId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadExams() {
      try {
        const data = await apiRequest("/student/exams");
        setExams(data.exams || []);
      } catch (err) {
        setError(err.message || "Unable to load available exams.");
      } finally {
        setLoading(false);
      }
    }

    loadExams();
  }, []);

  async function handleStartExam(examId) {
    setError("");
    setStartingExamId(examId);

    try {
      const data = await startAttempt(examId);
      const attempt = data.attempt;

      if (!attempt?.attemptId || !attempt?.expiresAt || !attempt?.questions) {
        throw new Error("The server returned incomplete exam attempt details.");
      }

      navigate("/student/exam", {
        state: { attempt },
      });
    } catch (err) {
      setError(err.message || "Unable to start the exam.");
    } finally {
      setStartingExamId(null);
    }
  }

  return (
    <main>
      <h1>Student Dashboard</h1>
      <h2>Available Exams</h2>

      {loading && <p role="status">Loading available exams...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && exams.length === 0 && (
        <p>No exams are currently available.</p>
      )}

      {exams.map((exam) => (
        <article key={exam.examId}>
          <h3>{exam.title}</h3>
          <p>{exam.description || "No description available."}</p>
          <p>
            Duration: {Math.ceil(exam.durationSeconds / 60)} minutes
          </p>
          <p>
            Starts: {exam.startsAt
              ? new Date(exam.startsAt).toLocaleString()
              : "Available now"}
          </p>
          <p>
            Ends: {exam.endsAt
              ? new Date(exam.endsAt).toLocaleString()
              : "No scheduled end"}
          </p>

          <button
            type="button"
            disabled={startingExamId !== null}
            onClick={() => handleStartExam(exam.examId)}
          >
            {startingExamId === exam.examId ? "Starting..." : "Start Exam"}
          </button>
        </article>
      ))}
    </main>
  );
}

function StudentExamRoute() {
  const location = useLocation();
  const attempt = location.state?.attempt;

  return <StudentExam initialAttempt={attempt} />;
}

function Admin() {
  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>
        <Link to="/question-bank">Manage Question Bank</Link>
      </p>
    </main>
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
          path="/student/exam"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentExamRoute />
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
