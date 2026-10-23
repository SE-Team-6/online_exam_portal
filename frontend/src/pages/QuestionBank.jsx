import { useState } from "react";

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({
    stem: "",
    correctAnswer: "",
    distractors: ["", "", ""],
    topic: "",
    difficulty: "Easy",
  });
  const [editingId, setEditingId] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleDistractorChange(index, value) {
    setForm((previous) => ({
      ...previous,
      distractors: previous.distractors.map((answer, i) =>
        i === index ? value : answer
      ),
    }));
  }

  function resetForm() {
    setForm({
      stem: "",
      correctAnswer: "",
      distractors: ["", "", ""],
      topic: "",
      difficulty: "Easy",
    });
    setEditingId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const question = { ...form, id: editingId ?? Date.now() };

    if (editingId !== null) {
      setQuestions((previous) =>
        previous.map((item) => (item.id === editingId ? question : item))
      );
    } else {
      setQuestions((previous) => [...previous, question]);
    }

    resetForm();
  }

  function handleEdit(question) {
    setForm({
      stem: question.stem,
      correctAnswer: question.correctAnswer,
      distractors: [...question.distractors],
      topic: question.topic,
      difficulty: question.difficulty,
    });
    setEditingId(question.id);
  }

  function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions((previous) => previous.filter((item) => item.id !== id));
    }
  }

  return (
    <main className="question-bank">
      <h1>Question Bank Management</h1>

      <form onSubmit={handleSubmit}>
        <h2>{editingId !== null ? "Edit Question" : "Create Question"}</h2>

        <label>
          Question
          <textarea
            name="stem"
            value={form.stem}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Correct Answer
          <input
            name="correctAnswer"
            value={form.correctAnswer}
            onChange={handleChange}
            required
          />
        </label>

        {form.distractors.map((answer, index) => (
          <label key={index}>
            Distractor {index + 1}
            <input
              value={answer}
              onChange={(event) =>
                handleDistractorChange(index, event.target.value)
              }
              required
            />
          </label>
        ))}

        <label>
          Topic
          <input
            name="topic"
            value={form.topic}
            onChange={handleChange}
            placeholder="e.g. DBMS"
            required
          />
        </label>

        <label>
          Difficulty
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </label>

        <button type="submit">
          {editingId !== null ? "Update Question" : "Add Question"}
        </button>

        {editingId !== null && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      <h2>Questions ({questions.length})</h2>

      {questions.length === 0 && <p>No questions added yet.</p>}

      {questions.map((question) => (
        <article key={question.id} className="question-card">
          <h3>{question.stem}</h3>
          <p>
            <strong>Correct answer:</strong> {question.correctAnswer}
          </p>
          <p>
            <strong>Other options:</strong> {question.distractors.join(", ")}
          </p>
          <p>
            <span>{question.topic}</span> ·{" "}
            <span>{question.difficulty}</span>
          </p>
          <button type="button" onClick={() => handleEdit(question)}>
            Edit
          </button>
          <button type="button" onClick={() => handleDelete(question.id)}>
            Delete
          </button>
        </article>
      ))}
    </main>
  );
}

export default QuestionBank;