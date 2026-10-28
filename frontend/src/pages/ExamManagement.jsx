
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function ExamManagement() {
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    title: "",
    startAt: "",
    durationMinutes: "60",
    questionIds: [],
  });

  useEffect(() => {
    let active = true;

    async function loadQuestions() {
      try {
        setLoadingQuestions(true);
        const data = await apiRequest("/admin/questions");

        if (active) {
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.status === 401 || err.status === 403
              ? "Please log in with an instructor or admin account to load questions."
              : err.message || "Unable to load questions from the server."
          );
        }
      } finally {
        if (active) setLoadingQuestions(false);
      }
    }

    loadQuestions();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleQuestion(questionId) {
    setForm((current) => ({
      ...current,
      questionIds: current.questionIds.includes(questionId)
        ? current.questionIds.filter((id) => id !== questionId)
        : [...current.questionIds, questionId],
    }));
  }

  function handleSchedule(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (form.questionIds.length === 0) {
      setError("Select at least one question for the exam.");
      return;
    }

    const startDate = new Date(form.startAt);

    if (Number.isNaN(startDate.getTime()) || startDate <= new Date()) {
      setError("Choose a valid start time in the future.");
      return;
    }

    const duration = Number(form.durationMinutes);

    if (!Number.isInteger(duration) || duration < 1) {
      setError("Duration must be at least 1 minute.");
      return;
    }

    // Temporary preview only. Exam scheduling API is not yet confirmed.
    const exam = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      startAt: startDate.toISOString(),
      durationMinutes: duration,
      questionIds: [...form.questionIds],
    };

    if (!exam.title) {
      setError("Enter an exam title.");
      return;
    }

    setExams((current) => [...current, exam]);
    setForm({
      title: "",
      startAt: "",
      durationMinutes: "60",
      questionIds: [],
    });
    setNotice(
      "Exam added to this temporary preview only. It has not been saved to the server."
    );
  }

  function formatDate(date) {
    return new Date(date).toLocaleString();
  }

  return (
    <main className="exam-management">
      <header>
        <h1>Admin Exam Management</h1>
        <p>Create exams, schedule their start time, and select questions.</p>
      </header>

      {error && (
        <p role="alert" className="exam-message exam-error">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="exam-message exam-notice">
          {notice}
        </p>
      )}

      <section className="exam-panel">
        <h2>Schedule an exam</h2>

        <form onSubmit={handleSchedule}>
          <label htmlFor="exam-title">Exam title</label>
          <input
            id="exam-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. DBMS Internal Assessment"
            required
          />

          <label htmlFor="exam-start">Start date and time</label>
          <input
            id="exam-start"
            name="startAt"
            type="datetime-local"
            value={form.startAt}
            onChange={handleChange}
            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)}
            required
          />

          <label htmlFor="exam-duration">Duration (minutes)</label>
          <input
            id="exam-duration"
            name="durationMinutes"
            type="number"
            min="1"
            max="600"
            value={form.durationMinutes}
            onChange={handleChange}
            required
          />

          <h3>Select questions</h3>

          {loadingQuestions ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p>No questions are available. Check the backend and your login.</p>
          ) : (
            <div className="exam-question-list">
              {questions.map((question) => {
                const id = question._id ?? question.id ?? question.questionId;

                if (!id) return null;

                return (
                  <label className="exam-question-option" key={id}>
                    <input
                      type="checkbox"
                      checked={form.questionIds.includes(String(id))}
                      onChange={() => toggleQuestion(String(id))}
                    />
                    <span>
                      <strong>{question.stem}</strong>
                      <small>
                        {(question.tags ?? []).join(", ") || "No topic tags"}
                        {" · "}
                        {question.difficulty ?? "Difficulty not set"}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <p>
            Selected questions: <strong>{form.questionIds.length}</strong>
          </p>

          <button type="submit" disabled={saving || loadingQuestions}>
            {saving ? "Scheduling..." : "Add exam to preview"}
          </button>
        </form>
      </section>

      <section className="exam-panel">
        <h2>Exam list</h2>

        {exams.length === 0 ? (
          <p>No exams in this preview yet.</p>
        ) : (
          <div className="exam-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Start time</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Attempt count</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.title}</td>
                    <td>{formatDate(exam.startAt)}</td>
                    <td>{exam.durationMinutes} min</td>
                    <td>{exam.questionIds.length}</td>
                    <td>Unavailable — backend API pending</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default ExamManagement;
