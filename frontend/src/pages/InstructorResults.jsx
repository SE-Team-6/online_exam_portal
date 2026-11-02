import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function formatPercentile(value) {
  const suffix = value % 100 >= 11 && value % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[value % 10] ?? "th");
  return `${value}${suffix}`;
}

function downloadCsv(rows) {
  const headers = [
    "Student",
    "Email",
    "Exam",
    "Score",
    "Maximum score",
    "Percentage",
    "Percentile",
    "Submitted at",
  ];
  const lines = [
    headers,
    ...rows.map((result) => [
      result.studentName,
      result.studentEmail,
      result.examTitle,
      result.score,
      result.maxScore,
      result.percentage,
      result.percentile,
      formatDate(result.submittedAt),
    ]),
  ].map((row) => row.map(csvCell).join(","));

  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exam-results.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function InstructorResults() {
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadResults() {
      try {
        const data = await apiRequest("/admin/results?limit=500");
        if (active) {
          setResults(Array.isArray(data.results) ? data.results : []);
          setTotalResults(data.analytics?.resultCount ?? 0);
        }
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load exam results.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResults();
    return () => {
      active = false;
    };
  }, []);

  const exams = useMemo(() => {
    const unique = new Map();
    results.forEach((result) => unique.set(result.examId, result.examTitle));
    return [...unique.entries()].map(([id, title]) => ({ id, title }));
  }, [results]);

  const filteredResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return results.filter((result) => {
      const matchesExam = selectedExam === "all" || result.examId === selectedExam;
      const matchesSearch = !query ||
        result.studentName.toLowerCase().includes(query) ||
        result.studentEmail.toLowerCase().includes(query);
      return matchesExam && matchesSearch;
    });
  }, [results, searchTerm, selectedExam]);

  const analytics = useMemo(() => {
    const percentages = filteredResults.map((result) => result.percentage);
    if (percentages.length === 0) {
      return { average: 0, highest: 0, lowest: 0 };
    }
    return {
      average: Number((percentages.reduce((sum, value) => sum + value, 0) / percentages.length).toFixed(1)),
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
    };
  }, [filteredResults]);

  return (
    <main className="report-page">
      <header className="report-header">
        <div>
          <p className="eyebrow">STAFF WORKSPACE</p>
          <h1>Results &amp; Analytics</h1>
          <p>Review submitted attempts, compare performance, and export a report.</p>
        </div>
        <button
          type="button"
          className="report-primary-action"
          disabled={filteredResults.length === 0}
          onClick={() => downloadCsv(filteredResults)}
        >
          Export CSV
        </button>
      </header>

      {loading && <p className="report-state" role="status">Loading results...</p>}
      {!loading && error && <p className="report-state report-error" role="alert">{error}</p>}
      {!loading && !error && totalResults === 0 && (
        <section className="report-state">
          <h2>No submitted attempts yet</h2>
          <p>Exam results and analytics will appear here after students submit attempts.</p>
        </section>
      )}

      {!loading && !error && totalResults > 0 && (
        <>
          <section className="report-metrics" aria-label="Filtered exam analytics">
            <article><span>Submissions</span><strong>{filteredResults.length}</strong></article>
            <article><span>Average</span><strong>{analytics.average}%</strong></article>
            <article><span>Highest</span><strong>{analytics.highest}%</strong></article>
            <article><span>Lowest</span><strong>{analytics.lowest}%</strong></article>
          </section>

          <section className="report-panel" aria-labelledby="admin-results-heading">
            <div className="report-filters">
              <h2 id="admin-results-heading">Student scores</h2>
              <label>
                Exam
                <select value={selectedExam} onChange={(event) => setSelectedExam(event.target.value)}>
                  <option value="all">All exams</option>
                  {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                </select>
              </label>
              <label>
                Search students
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name or email"
                />
              </label>
            </div>

            {filteredResults.length === 0 ? (
              <p className="report-state" role="status">No results match these filters.</p>
            ) : (
              <div className="report-table-wrap">
                <table className="report-table">
                  <caption>Submitted exam results and percentiles</caption>
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Exam</th>
                      <th scope="col">Score</th>
                      <th scope="col">Percentage</th>
                      <th scope="col">Percentile</th>
                      <th scope="col">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr key={result.resultId}>
                        <td><strong>{result.studentName}</strong><small>{result.studentEmail}</small></td>
                        <td>{result.examTitle}</td>
                        <td>{result.score} / {result.maxScore}</td>
                        <td>{result.percentage.toFixed(1)}%</td>
                        <td>{formatPercentile(result.percentile)}</td>
                        <td>{formatDate(result.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalResults > results.length && (
              <p className="report-note" role="note">
                Showing {results.length} of {totalResults} results. Export is limited to the displayed rows.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default InstructorResults;
