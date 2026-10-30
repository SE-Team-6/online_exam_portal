
import { useEffect, useRef, useState } from "react";

const sampleQuestions = [
  {
    id: 1,
    text: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Text Machine Language",
      "Hyper Transfer Markup Language",
      "Home Tool Markup Language",
    ],
  },
  {
    id: 2,
    text: "Which language is used to style web pages?",
    options: ["Python", "CSS", "SQL", "Java"],
  },
  {
    id: 3,
    text: "Which one is a JavaScript library?",
    options: ["React", "MongoDB", "Express", "MySQL"],
  },
];

function StudentExam() {
  const [questions] = useState(sampleQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [saveStatus, setSaveStatus] = useState("Not saved");
  const [message, setMessage] = useState("");
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const hasExpiryTime = Boolean(sessionStorage.getItem("expiresAt"));

  useEffect(() => {
    const expiresAt = sessionStorage.getItem("expiresAt");

    if (!expiresAt) return;

    const expiryTime = new Date(expiresAt).getTime();

    if (Number.isNaN(expiryTime)) return;

    function updateTimer() {
      const remaining = Math.max(
        0,
        Math.ceil((expiryTime - Date.now()) / 1000)
      );

      setTimeLeft(remaining);

      if (remaining === 0) {
        setSubmitted(true);
        setShowSubmitWarning(false);
        setMessage("Time is up. The exam must be submitted.");
      }
    }

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (showSubmitWarning) {
      cancelButtonRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [showSubmitWarning]);

  function selectAnswer(questionId, option) {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: option,
    }));

    setSaveStatus("Unsaved");
    setMessage("Answer changed. Backend save API is not connected yet.");
  }

  function openSubmitWarning(event) {
    previousFocusRef.current = event.currentTarget;
    setShowSubmitWarning(true);
  }

  function cancelSubmit() {
    setShowSubmitWarning(false);
  }

  function handleSubmit() {
    setSubmitted(true);
    setShowSubmitWarning(false);
    setMessage("Submission UI complete. Connect the backend submit API.");
  }

  function handleDialogKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelSubmit();
      return;
    }

    if (event.key === "Tab") {
      const firstButton = cancelButtonRef.current;
      const lastButton = submitButtonRef.current;

      if (!firstButton || !lastButton) return;

      if (event.shiftKey && document.activeElement === firstButton) {
        event.preventDefault();
        lastButton.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastButton
      ) {
        event.preventDefault();
        firstButton.focus();
      }
    }
  }

  const currentQuestion = questions[currentIndex];

  return (
    <main className="student-exam">
      <h1>Student Exam</h1>

      <p>
        <strong>Time remaining: </strong>
        <span role="timer" aria-live="off">
          {timeLeft === null
            ? "--:--"
            : `${Math.floor(timeLeft / 60)}:${String(
                timeLeft % 60
              ).padStart(2, "0")}`}
        </span>
      </p>

      <p role="status" aria-live="polite" aria-atomic="true">
        Save status: {saveStatus}
      </p>

      {(message ||
        (!hasExpiryTime
          ? "Exam expiry time is unavailable. Connect the exam start API."
          : "")) && (
        <p role="status" aria-live="polite" aria-atomic="true">
          {message ||
            "Exam expiry time is unavailable. Connect the exam start API."}
        </p>
      )}

      <section aria-labelledby="question-navigator-heading">
        <h2 id="question-navigator-heading">Question Navigator</h2>

        <div className="question-navigator">
          {questions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              disabled={submitted}
              onClick={() => setCurrentIndex(index)}
              aria-current={index === currentIndex ? "step" : undefined}
              aria-label={`Go to question ${index + 1}. ${
                answers[item.id] ? "Answered" : "Unanswered"
              }${index === currentIndex ? ". Current question" : ""}`}
            >
              {index + 1} - {answers[item.id] ? "Answered" : "Unanswered"}
            </button>
          ))}
        </div>
      </section>

      {currentQuestion && (
        <section aria-labelledby="current-question-heading">
          <h2 id="current-question-heading" tabIndex={-1}>
            Question {currentIndex + 1} of {questions.length}
          </h2>

          <fieldset disabled={submitted}>
            <legend>{currentQuestion.text}</legend>

            {currentQuestion.options.map((option) => (
              <label
                key={option}
                style={{ display: "block", margin: "12px 0" }}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={() =>
                    selectAnswer(currentQuestion.id, option)
                  }
                />{" "}
                {option}
              </label>
            ))}
          </fieldset>

          <div className="exam-navigation">
            <button
              type="button"
              disabled={currentIndex === 0 || submitted}
              onClick={() => setCurrentIndex((index) => index - 1)}
            >
              Previous question
            </button>

            <button
              type="button"
              disabled={
                currentIndex === questions.length - 1 || submitted
              }
              onClick={() => setCurrentIndex((index) => index + 1)}
            >
              Next question
            </button>
          </div>
        </section>
      )}

      {!submitted && (
        <button type="button" onClick={openSubmitWarning}>
          Submit Exam
        </button>
      )}

      {showSubmitWarning && !submitted && (
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="submit-warning-heading"
          aria-describedby="submit-warning-description"
          onKeyDown={handleDialogKeyDown}
        >
          <h2 id="submit-warning-heading">Confirm submission</h2>

          <p id="submit-warning-description">
            Are you sure you want to submit your exam?
          </p>

          <button
            ref={submitButtonRef}
            type="button"
            onClick={handleSubmit}
          >
            Yes, submit
          </button>

          <button
            ref={cancelButtonRef}
            type="button"
            onClick={cancelSubmit}
          >
            Cancel submission
          </button>
        </section>
      )}
    </main>
  );
}

export default StudentExam;
