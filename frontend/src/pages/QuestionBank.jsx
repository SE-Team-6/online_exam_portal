
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
  const [statusMessage, setStatusMessage] = useState("");

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
      setStatusMessage("Question updated successfully.");
    } else {
      setQuestions((previous) => [...previous, question]);
      setStatusMessage("Question added successfully.");
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
    setStatusMessage(`Editing question: ${question.stem}`);
  }

  function handleDelete(id) {
    const question = questions.find((item) => item.id === id);

    if (
      window.confirm("Are you sure you want to delete this question?")
    ) {
      setQuestions((previous) => previous.filter((item) => item.id !== id));
      setStatusMessage("Question deleted successfully.");

      if (editingId === id) {
        resetForm();
      }
    }
  }

  function handleCancel() {
    resetForm();
    setStatusMessage("Editing cancelled.");
  }

  return (
    <main className="question-bank">
      <h1>Question Bank Management</h1>

      <p role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      <form onSubmit={handleSubmit} aria-labelledby="question-form-heading">
        <h2 id="question-form-heading">
          {editingId !== null ? "Edit Question" : "Create Question"}
        </h2>

        <label htmlFor="question-stem">Question</label>
        <textarea
          id="question-stem"
          name="stem"
          value={form.stem}
          onChange={handleChange}
          required
        />

        <label htmlFor="correct-answer">Correct Answer</label>
        <input
          id="correct-answer"
          name="correctAnswer"
          type="text"
          value={form.correctAnswer}
          onChange={handleChange}
          required
        />

        {form.distractors.map((answer, index) => (
          <div key={index}>
            <label htmlFor={`distractor-${index + 1}`}>
              Incorrect option {index + 1}
            </label>
            <input
              id={`distractor-${index + 1}`}
              name={`distractor-${index + 1}`}
              type="text"
              value={answer}
              onChange={(event) =>
                handleDistractorChange(index, event.target.value)
              }
              required
            />
          </div>
        ))}

        <label htmlFor="question-topic">Topic</label>
        <input
          id="question-topic"
          name="topic"
          type="text"
          value={form.topic}
          onChange={handleChange}
          placeholder="e.g. DBMS"
          required
        />

        <label htmlFor="question-difficulty">Difficulty</label>
        <select
          id="question-difficulty"
          name="difficulty"
          value={form.difficulty}
          onChange={handleChange}
          required
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <button type="submit">
          {editingId !== null ? "Update Question" : "Add Question"}
        </button>

        {editingId !== null && (
          <button type="button" onClick={handleCancel}>
            Cancel editing
          </button>
        )}
      </form>

      <h2 id="question-list-heading">
        Questions ({questions.length})
      </h2>

      {questions.length === 0 && (
        <p>No questions added yet.</p>
      )}

      <section aria-labelledby="question-list-heading">
        {questions.map((question) => (
          <article key={question.id} className="question-card">
            <h3>{question.stem}</h3>

            <p>
              <strong>Correct answer:</strong> {question.correctAnswer}
            </p>

            <p>
              <strong>Other options:</strong>{" "}
              {question.distractors.join(", ")}
            </p>

            <p>
              <span>Topic: {question.topic}</span> ·{" "}
              <span>Difficulty: {question.difficulty}</span>
            </p>

            <button
              type="button"
              onClick={() => handleEdit(question)}
              aria-label={`Edit question: ${question.stem}`}
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => handleDelete(question.id)}
              aria-label={`Delete question: ${question.stem}`}
            >
              Delete
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default QuestionBank;
