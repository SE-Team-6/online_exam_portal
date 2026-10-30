import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const emptyForm = {
  stem: "",
  correctOptionId: "a",
  options: [
    { optionId: "a", text: "" },
    { optionId: "b", text: "" },
    { optionId: "c", text: "" },
    { optionId: "d", text: "" },
  ],
  tags: [""],
  difficulty: "Easy",
};

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function loadQuestions() {
    try {
      const data = await apiRequest("/admin/questions");
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load questions.");
    }
  }

  useEffect(() => {
    let active = true;
    async function loadOnMount() {
      try {
        const data = await apiRequest("/admin/questions");
        if (active) setQuestions(Array.isArray(data.questions) ? data.questions : []);
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load questions.");
      }
    }
    loadOnMount();
    return () => { active = false; };
  }, []);

  function updateOption(index, text) {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text } : option
      ),
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    const payload = { ...form, tags: form.tags.filter(Boolean) };
    try {
      const wasEditing = Boolean(editingId);
      const endpoint = wasEditing ? `/admin/questions/${editingId}` : "/admin/questions";
      await apiRequest(endpoint, {
        method: wasEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      resetForm();
      await loadQuestions();
      setStatusMessage(wasEditing ? "Question updated successfully." : "Question added successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save the question.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    setError("");
    try {
      await apiRequest(`/admin/questions/${id}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      await loadQuestions();
      setStatusMessage("Question deleted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete the question.");
    }
  }

  function handleEdit(question) {
    setForm({
      stem: question.stem,
      correctOptionId: question.correctOptionId,
      options: question.options,
      tags: question.tags?.length ? question.tags : [""],
      difficulty: question.difficulty,
    });
    setEditingId(question._id);
    setStatusMessage(`Editing question: ${question.stem}`);
  }

  function handleCancel() {
    resetForm();
    setStatusMessage("Editing cancelled.");
  }

  return (
    <main className="question-bank">
      <h1>Question Bank Management</h1>
      {error && <p role="alert">{error}</p>}
      <p role="status" aria-live="polite" aria-atomic="true">{statusMessage}</p>

      <form onSubmit={handleSubmit} aria-labelledby="question-form-heading">
        <h2 id="question-form-heading">{editingId ? "Edit Question" : "Create Question"}</h2>

        <label htmlFor="question-stem">Question</label>
        <textarea
          id="question-stem"
          name="stem"
          value={form.stem}
          onChange={(event) => setForm({ ...form, stem: event.target.value })}
          required
        />

        {form.options.map((option, index) => (
          <div key={option.optionId}>
            <label htmlFor={`option-${option.optionId}`}>Option {option.optionId}</label>
            <input
              id={`option-${option.optionId}`}
              name={`option-${option.optionId}`}
              value={option.text}
              onChange={(event) => updateOption(index, event.target.value)}
              required
            />
          </div>
        ))}

        <label htmlFor="correct-option">Correct option</label>
        <select
          id="correct-option"
          name="correctOptionId"
          value={form.correctOptionId}
          onChange={(event) => setForm({ ...form, correctOptionId: event.target.value })}
        >
          {form.options.map((option) => (
            <option key={option.optionId} value={option.optionId}>{option.optionId}</option>
          ))}
        </select>

        <label htmlFor="question-tags">Tags</label>
        <input
          id="question-tags"
          name="tags"
          value={form.tags[0]}
          onChange={(event) => setForm({ ...form, tags: [event.target.value] })}
        />

        <label htmlFor="question-difficulty">Difficulty</label>
        <select
          id="question-difficulty"
          name="difficulty"
          value={form.difficulty}
          onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        <button type="submit">{editingId ? "Update Question" : "Add Question"}</button>
        {editingId && <button type="button" onClick={handleCancel}>Cancel editing</button>}
      </form>

      <h2 id="question-list-heading">Questions ({questions.length})</h2>
      {questions.length === 0 && <p>No questions added yet.</p>}
      <section aria-labelledby="question-list-heading">
        {questions.map((question) => (
          <article key={question._id} className="question-card">
            <h3>{question.stem}</h3>
            <p>{question.options.map((option) => option.text).join(", ")}</p>
            <p>{question.difficulty}</p>
            <button type="button" onClick={() => handleEdit(question)} aria-label={`Edit question: ${question.stem}`}>
              Edit
            </button>
            <button type="button" onClick={() => handleDelete(question._id)} aria-label={`Delete question: ${question.stem}`}>
              Delete
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default QuestionBank;
