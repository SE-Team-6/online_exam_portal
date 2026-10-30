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

  async function loadQuestions() {
    try {
      const data = await apiRequest("/admin/questions");
      setQuestions(data.questions);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuestions();
    }, 0);
    return () => clearTimeout(timer);
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
    const payload = { ...form, tags: form.tags.filter(Boolean) };
    try {
      const endpoint = editingId
        ? `/admin/questions/${editingId}`
        : "/admin/questions";
      await apiRequest(endpoint, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      resetForm();
      await loadQuestions();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await apiRequest(`/admin/questions/${id}`, { method: "DELETE" });
      await loadQuestions();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleEdit(question) {
    setForm({
      stem: question.stem,
      correctOptionId: question.correctOptionId,
      options: question.options,
      tags: question.tags.length ? question.tags : [""],
      difficulty: question.difficulty,
    });
    setEditingId(question._id);
  }

  return (
    <main className="question-bank">
      <h1>Question Bank Management</h1>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Question" : "Create Question"}</h2>
        <label>
          Question
          <textarea
            value={form.stem}
            onChange={(event) => setForm({ ...form, stem: event.target.value })}
            required
          />
        </label>
        {form.options.map((option, index) => (
          <label key={option.optionId}>
            Option {option.optionId}
            <input
              value={option.text}
              onChange={(event) => updateOption(index, event.target.value)}
              required
            />
          </label>
        ))}
        <label>
          Correct option
          <select
            value={form.correctOptionId}
            onChange={(event) => setForm({ ...form, correctOptionId: event.target.value })}
          >
            {form.options.map((option) => (
              <option key={option.optionId} value={option.optionId}>{option.optionId}</option>
            ))}
          </select>
        </label>
        <label>
          Tags
          <input
            value={form.tags[0]}
            onChange={(event) => setForm({ ...form, tags: [event.target.value] })}
          />
        </label>
        <label>
          Difficulty
          <select
            value={form.difficulty}
            onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </label>
        <button type="submit">{editingId ? "Update Question" : "Add Question"}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>

      <h2>Questions ({questions.length})</h2>
      {questions.map((question) => (
        <article key={question._id} className="question-card">
          <h3>{question.stem}</h3>
          <p>{question.options.map((option) => option.text).join(", ")}</p>
          <p>{question.difficulty}</p>
          <button type="button" onClick={() => handleEdit(question)}>Edit</button>
          <button type="button" onClick={() => handleDelete(question._id)}>Delete</button>
        </article>
      ))}
    </main>
  );
}

export default QuestionBank;
