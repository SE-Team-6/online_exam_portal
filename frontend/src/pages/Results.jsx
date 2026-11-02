import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function formatPercentile(value) {
  const suffix = value % 100 >= 11 && value % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th");
  return `${value}${suffix}`;
}

function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadResults() {
      try {
        const data = await apiRequest("/student/results");
        if (active) setResults(Array.isArray(data.results) ? data.results : []);
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load results.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResults();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="report-page">
      <header className="report-header">
        <div>
          <p className="eyebrow">STUDENT WORKSPACE</p>
          <h1>Exam Results</h1>
          <p>Your completed attempts and performance.</p>
        </div>
        <Link to="/student" className="report-back-link">Back to exams</Link>
      </header>

      {loading && <p className="report-state" role="status">Loading your results...</p>}
      {!loading && error && <p className="report-state report-error" role="alert">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <section className="report-state">
          <h2>No results yet</h2>
          <p>Completed exams will appear here after submission.</p>
          <Link to="/student">Browse available exams</Link>
        </section>
      )}

      {!loading && !error && results.length > 0 && (
        <section className="report-panel" aria-labelledby="student-results-heading">
          <h2 id="student-results-heading">Completed attempts ({results.length})</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <caption>Your submitted exam scores and cohort percentiles</caption>
              <thead>
                <tr>
                  <th scope="col">Exam</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Score</th>
                  <th scope="col">Percentage</th>
                  <th scope="col">Percentile</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.resultId}>
                    <td>{result.examTitle}</td>
                    <td>{formatDate(result.submittedAt)}</td>
                    <td>{result.score} / {result.maxScore}</td>
                    <td>{result.percentage.toFixed(1)}%</td>
                    <td>{formatPercentile(result.percentile)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

export default Results;
