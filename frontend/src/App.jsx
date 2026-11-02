
import ExamManagement from "./pages/ExamManagement";
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
import InstructorResults from "./pages/InstructorResults";
import Results from "./pages/Results";
import StudentExam from "./pages/StudentExam";

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
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
        body: JSON.stringify({ identifier, password }),
      });

      const token = data.token ?? data.accessToken;
      const role = String(
        data.role ?? data.user?.role ?? ""
      ).toLowerCase();

      if (!token || !["student", "admin", "instructor"].includes(role)) {
        throw new Error(
          "The server response is missing a valid token or role."
        );
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
        setError(
          "Your account is locked. Please contact the administrator."
        );
      } else {
        setError(err.message || "Unable to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="login-identifier">Email</label>
        <input
          id="login-identifier"
          name="identifier"
          type="email"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
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
    <main className="auth-page">
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
    let active = true;

    async function loadAvailableExams() {
      try {
        const data = await apiRequest("/student/exams");

        if (active) {
          setExams(Array.isArray(data.exams) ? data.exams : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load available examinations."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAvailableExams();

    return () => {
      active = false;
    };
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

      navigate("/student/exam", { state: { attempt } });
    } catch (err) {
      setError(err.message || "Unable to start the exam.");
    } finally {
      setStartingExamId(null);
    }
  }

  function formatDate(date) {
    if (!date) return "Not specified";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "Not specified"
      : parsed.toLocaleString();
  }

  function formatDuration(seconds) {
    if (!seconds) return "Not specified";

    const minutes = Math.round(Number(seconds) / 60);
    return `${minutes} minutes`;
  }

  return (
    <main className="student-dashboard">
      <header className="student-dashboard-header">
        <div>
          <p className="eyebrow">STUDENT WORKSPACE</p>
          <h1>Student Dashboard</h1>
          <p>View your available examinations and results.</p>
        </div>

        <nav className="student-dashboard-actions">
          <Link to="/results" className="student-action-link">
            View Results
          </Link>
        </nav>
      </header>

      <section className="student-dashboard-content">
        <div className="student-exams-heading">
          <div>
            <h2>Available Examinations</h2>
            <p>Examinations currently available to you.</p>
          </div>

          <span className="student-exam-count">
            {exams.length} {exams.length === 1 ? "Exam" : "Exams"}
          </span>
        </div>

        {loading && (
          <p className="student-state-message" role="status">
            Loading available examinations...
          </p>
        )}

        {!loading && error && (
          <p className="student-state-message student-state-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && exams.length === 0 && (
          <p className="student-state-message">
            No examinations are currently available. Please check again later.
          </p>
        )}

        {!loading && !error && exams.length > 0 && (
          <div className="student-exams-grid">
            {exams.map((exam) => (
              <article
                className="student-exam-card"
                key={exam.examId}
              >
                <div className="student-exam-card-heading">
                  <h3>{exam.title}</h3>
                  <span className="student-exam-status">
                    Available
                  </span>
                </div>

                {exam.description && (
                  <p>{exam.description}</p>
                )}

                <div className="student-exam-meta">
                  <p>
                    <strong>Duration:</strong>{" "}
                    {formatDuration(exam.durationSeconds)}
                  </p>

                  <p>
                    <strong>Starts:</strong>{" "}
                    {formatDate(exam.startsAt)}
                  </p>

                  <p>
                    <strong>Ends:</strong>{" "}
                    {formatDate(exam.endsAt)}
                  </p>
                </div>

                <button
                  type="button"
                  className="student-start-button"
                  disabled={startingExamId !== null}
                  onClick={() => handleStartExam(exam.examId)}
                >
                  {startingExamId === exam.examId ? "Starting..." : "Start Exam"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StudentExamRoute() {
  const location = useLocation();
  return <StudentExam initialAttempt={location.state?.attempt} />;
}

function Admin() {
  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>
        <Link to="/question-bank">Manage Question Bank</Link>
      </p>
      <p>
        <Link to="/admin/exams">Manage Exams</Link>
      </p>
      <p>
        <Link to="/instructor-results">
          View Instructor Results &amp; Analytics
        </Link>
      </p>
    </main>
  );
}

function App() {
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem("highContrast") === "true"
  );

  function toggleHighContrast() {
    setHighContrast((previous) => {
      const next = !previous;
      localStorage.setItem("highContrast", String(next));
      return next;
    });
  }

  return (
    <div className={highContrast ? "high-contrast" : ""}>
      <button
        type="button"
        onClick={toggleHighContrast}
        aria-pressed={highContrast}
      >
        {highContrast ? "Turn off high contrast" : "Turn on high contrast"}
      </button>

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
            path="/results"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Results />
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
            path="/admin/exams"
            element={
              <ProtectedRoute allowedRoles={["admin", "instructor"]}>
                <ExamManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor-results"
            element={
              <ProtectedRoute allowedRoles={["admin", "instructor"]}>
                <InstructorResults />
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
    </div>
  );
}

export default App;
