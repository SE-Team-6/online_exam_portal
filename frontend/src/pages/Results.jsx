
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function Results() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResults() {
      try {
        // The results API endpoint must be confirmed by the backend team.
        // Until then, show the result-unavailable state.
        setError("Your results are currently unavailable. Please try again later.");
      } catch {
        setError("Unable to load your results. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  if (loading) {
    return (
      <main className="results-page">
        <p>Loading your results...</p>
      </main>
    );
  }

  return (
    <main className="results-page">
      <header className="results-header">
        <h1>Exam Results</h1>
        <p>View your performance in the exam.</p>
      </header>

      {error ? (
        <section className="results-message" role="status">
          <h2>Results unavailable</h2>
          <p>{error}</p>
        </section>
      ) : result ? (
        <section className="results-card">
          <h2>Your Score</h2>
          <p>
            Score: {result.score} / {result.maxScore}
          </p>
          <p>Percentage: {result.percentage}%</p>
        </section>
      ) : null}
    </main>
  );
}

export default Results;
