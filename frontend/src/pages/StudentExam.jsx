
import { useCallback, useEffect, useRef, useState } from "react";
import {
  saveAttemptAnswer,
  submitAttempt,
} from "../services/attemptService";

function StudentExam({ examId, initialAttempt }) {
  const [attempt, setAttempt] = useState(initialAttempt || null);
  const [questions, setQuestions] = useState(
    initialAttempt?.questions || []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [message, setMessage] = useState("");
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submittingRef = useRef(false);
  const answersRef = useRef({});
  const pendingSavesRef = useRef(new Map());

  const startTime = attempt?.expiresAt;

  const handleSubmit = useCallback(async (automatic = false) => {
    if (!attempt?.attemptId || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setMessage(automatic ? "Time is up. Submitting exam..." : "Submitting exam...");

    try {
      // Wait for any pending answer saves before submitting.
      await Promise.allSettled(
        Array.from(pendingSavesRef.current.values())
      );

      const data = await submitAttempt(attempt.attemptId);

      setSubmitted(true);
      setShowSubmitWarning(false);
      setMessage(
        automatic
          ? "Time is up. Your exam was submitted automatically."
          : "Your exam was submitted successfully."
      );

      return data;
    } catch (error) {
      submittingRef.current = false;
      setMessage(error.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [attempt]);

  const saveAnswer = useCallback(async (questionId, optionId) => {
    if (!attempt?.attemptId || submittingRef.current) return;

    const previousSave = pendingSavesRef.current.get(questionId);

    const savePromise = (async () => {
      if (previousSave) await previousSave.catch(() => {});

      setSaveStatus((previous) => ({
        ...previous,
        [questionId]: "Saving...",
      }));

      try {
        await saveAttemptAnswer(
          attempt.attemptId,
          questionId,
          optionId
        );

        setSaveStatus((previous) => ({
          ...previous,
          [questionId]: "Saved",
        }));
      } catch (error) {
        setSaveStatus((previous) => ({
          ...previous,
          [questionId]: "Failed",
        }));
        setMessage(error.message || "Answer could not be saved.");
        throw error;
      }
    })();

    pendingSavesRef.current.set(questionId, savePromise);

    try {
      await savePromise;
    } catch {
      // Failure is displayed beside the question for manual retry.
    } finally {
      if (pendingSavesRef.current.get(questionId) === savePromise) {
        pendingSavesRef.current.delete(questionId);
      }
    }
  }, [attempt]);

  function selectAnswer(questionId, optionId) {
    if (submitted || submitting) return;

    const updatedAnswers = {
      ...answersRef.current,
      [questionId]: optionId,
    };

    answersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);

    saveAnswer(questionId, optionId);
  }

  useEffect(() => {
    if (!startTime || submitted) return;

    const expiryTime = new Date(startTime).getTime();

    if (Number.isNaN(expiryTime)) {
      setMessage("Invalid exam expiry time.");
      return;
    }

    let expired = false;

    function updateTimer() {
      const remaining = Math.max(
        0,
        Math.ceil((expiryTime - Date.now()) / 1000)
      );

      setTimeLeft(remaining);

      if (remaining === 0 && !expired) {
        expired = true;
        handleSubmit(true);
      }
    }

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, [startTime, submitted, handleSubmit]);

  const currentQuestion = questions[currentIndex];

  if (!attempt) {
    return (
      <main>
        <h1>Student Exam</h1>
        <p role="alert">
          No active exam attempt was provided.
        </p>
      </main>
    );
  }

  return (
    <main>
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

      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}

      <section aria-label="Question navigator">
        <h2>Question Navigator</h2>

        <div className="question-navigator">
          {questions.map((question, index) => {
            const questionId = question.questionId;

            return (
              <button
                key={questionId}
                type="button"
                disabled={submitted || submitting}
                onClick={() => setCurrentIndex(index)}
                aria-current={index === currentIndex ? "step" : undefined}
              >
                {index + 1} -{" "}
                {answers[questionId] ? "Answered" : "Unanswered"}
              </button>
            );
          })}
        </div>
      </section>

      {currentQuestion && (
        <section aria-labelledby="current-question-heading">
          <h2 id="current-question-heading">
            Question {currentIndex + 1} of {questions.length}
          </h2>

          <fieldset disabled={submitted || submitting}>
            <legend>{currentQuestion.stem}</legend>

            {currentQuestion.options.map((option) => (
              <label
                key={option.optionId}
                style={{ display: "block", margin: "12px 0" }}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.questionId}`}
                  value={option.optionId}
                  checked={
                    answers[currentQuestion.questionId] === option.optionId
                  }
                  onChange={() =>
                    selectAnswer(
                      currentQuestion.questionId,
                      option.optionId
                    )
                  }
                />
                {" "}{option.text}
              </label>
            ))}
          </fieldset>

          <p role="status">
            Save status:{" "}
            {saveStatus[currentQuestion.questionId] || "Not saved"}
          </p>

          {saveStatus[currentQuestion.questionId] === "Failed" && (
            <button
              type="button"
              disabled={submitted || submitting}
              onClick={() =>
                saveAnswer(
                  currentQuestion.questionId,
                  answers[currentQuestion.questionId]
                )
              }
            >
              Retry saving answer
            </button>
          )}

          <div className="exam-navigation">
            <button
              type="button"
              disabled={currentIndex === 0 || submitted || submitting}
              onClick={() => setCurrentIndex((index) => index - 1)}
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                currentIndex === questions.length - 1 ||
                submitted ||
                submitting
              }
              onClick={() => setCurrentIndex((index) => index + 1)}
            >
              Next
            </button>
          </div>
        </section>
      )}

      {!submitted && (
        <button
          type="button"
          disabled={submitting}
          onClick={() => setShowSubmitWarning(true)}
        >
          Submit Exam
        </button>
      )}

      {showSubmitWarning && !submitted && (
        <section
          role="alertdialog"
          aria-labelledby="submit-warning-heading"
          aria-describedby="submit-warning-description"
        >
          <h2 id="submit-warning-heading">Confirm submission</h2>

          <p id="submit-warning-description">
            Are you sure you want to submit your exam?
          </p>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
          >
            {submitting ? "Submitting..." : "Yes, submit"}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => setShowSubmitWarning(false)}
          >
            Cancel
          </button>
        </section>
      )}
    </main>
  );
}

export default StudentExam;
