
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function ExamManagement() {
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingExams, setLoadingExams] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    title: "",
    startAt: "",
    durationMinutes: "60",
    questionIds: [],
  });

  async function loadExams() {
    setLoadingExams(true);
    try {
      const data = await apiRequest("/admin/exams");
      setExams(Array.isArray(data.exams) ? data.exams : []);
    } catch (err) {
      setError(err.message || "Unable to load saved exams.");
    } finally {
      setLoadingExams(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const data = await apiRequest("/admin/questions");
        if (active) {
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load questions.");
        }
      } finally {
        if (active) setLoadingQuestions(false);
      }

      try {
        const data = await apiRequest("/admin/exams");
        if (active) {
          setExams(Array.isArray(data.exams) ? data.exams : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load saved exams.");
        }
      } finally {
        if (active) setLoadingExams(false);
      }
    }

    loadInitialData();

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

  async function handleSchedule(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.title.trim()) {
      setError("Enter an exam title.");
      return;
    }

    if (form.questionIds.length === 0) {
      setError("Select at least one question.");
      return;
    }

    const startDate = new Date(form.startAt);

    if (!form.startAt || Number.isNaN(startDate.getTime()) || startDate <= new Date()) {
      setError("Choose a valid start time in the future.");
      return;
    }

    const durationMinutes = Number(form.durationMinutes);

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 600
    ) {
      setError("Duration must be between 1 and 600 minutes.");
      return;
    }

    const durationSeconds = durationMinutes * 60;
    const endDate = new Date(
      startDate.getTime() + durationSeconds * 1000
    );

    const payload = {
      title: form.title.trim(),
      questionIds: form.questionIds,
      durationSeconds,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
    };

    setSaving(true);

    try {
      await apiRequest("/admin/exams", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setNotice("Exam successfully saved to the server.");

      setForm({
        title: "",
        startAt: "",
        durationMinutes: "60",
        questionIds: [],
      });

      await loadExams();
    } catch (err) {
      setError(err.message || "Unable to schedule the exam.");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date) {
    if (!date) return "Not scheduled";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "Invalid date"
      : parsed.toLocaleString();
  }

  function getExamId(exam) {
    return String(exam._id ?? exam.id);
  }

  return (
    <main className="exam-management">
      <header className="page-heading">
        <p className="eyebrow">STAFF WORKSPACE</p>
        <h1>Exam Management</h1>
        <p>Create, schedule and manage examinations.</p>
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
        <h2>Schedule a new exam</h2>

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
            <p>No questions are available. Check your login and backend.</p>
          ) : (
            <div className="exam-question-list">
              {questions.map((question) => {
                const id =
                  question._id ?? question.id ?? question.questionId;

                if (!id) return null;

                const questionId = String(id);

                return (
                  <label className="exam-question-option" key={questionId}>
                    <input
                      type="checkbox"
                      checked={form.questionIds.includes(questionId)}
                      onChange={() => toggleQuestion(questionId)}
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
            {saving ? "Saving exam..." : "Schedule exam"}
          </button>
        </form>
      </section>

      <section className="exam-panel">
        <div className="exam-list-heading">
          <h2>Saved examinations</h2>
          <button
            type="button"
            onClick={loadExams}
            disabled={loadingExams}
          >
            {loadingExams ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loadingExams ? (
          <p>Loading saved exams...</p>
        ) : exams.length === 0 ? (
          <p>No examinations have been scheduled yet.</p>
        ) : (
          <div className="exam-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Start time</th>
                  <th>End time</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>In progress</th>
                  <th>Submitted</th>
                  <th>Expired</th>
                  <th>Total attempts</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => {
                  const counts = exam.attemptCounts ?? {};

                  return (
                    <tr key={getExamId(exam)}>
                      <td>{exam.title}</td>
                      <td>{formatDate(exam.startsAt)}</td>
                      <td>{formatDate(exam.endsAt)}</td>
                      <td>
                        {Math.round(
                          Number(exam.durationSeconds ?? 0) / 60
                        )} min
                      </td>
                      <td>
                        {exam.questionCount ?? exam.questionIds?.length ?? 0}
                      </td>
                      <td>{counts.inProgress ?? 0}</td>
                      <td>{counts.submitted ?? 0}</td>
                      <td>{counts.expired ?? 0}</td>
                      <td>{counts.total ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default ExamManagement;
