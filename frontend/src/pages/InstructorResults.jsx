
import { useMemo, useState } from "react";

const sampleResults = [
  { id: 1, studentName: "Ananya Rao", score: 85, totalMarks: 100 },
  { id: 2, studentName: "Rahul Kumar", score: 72, totalMarks: 100 },
  { id: 3, studentName: "Priya Sharma", score: 94, totalMarks: 100 },
  { id: 4, studentName: "Arjun Nair", score: 63, totalMarks: 100 },
  { id: 5, studentName: "Sneha Patel", score: 78, totalMarks: 100 },
];

function InstructorResults() {
  const [results] = useState(sampleResults);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResults = useMemo(
    () =>
      results.filter((result) =>
        result.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [results, searchTerm]
  );

  const analytics = useMemo(() => {
    if (results.length === 0) {
      return { average: 0, highest: 0, lowest: 0 };
    }

    const scores = results.map((result) => result.score);
    const total = scores.reduce((sum, score) => sum + score, 0);

    return {
      average: (total / scores.length).toFixed(1),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
    };
  }, [results]);

  return (
    <main className="instructor-results">
      <h1>Instructor Results &amp; Analytics</h1>
      <p>View student scores and overall exam performance.</p>

      <section aria-label="Exam score analytics">
        <article>
          <h2>Average Score</h2>
          <p>{analytics.average} / 100</p>
        </article>

        <article>
          <h2>Highest Score</h2>
          <p>{analytics.highest} / 100</p>
        </article>

        <article>
          <h2>Lowest Score</h2>
          <p>{analytics.lowest} / 100</p>
        </article>
      </section>

      <section aria-labelledby="student-results-heading">
        <h2 id="student-results-heading">Student Scores</h2>

        <label htmlFor="student-search">Search student by name</label>
        <input
          id="student-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Enter student name"
        />

        {filteredResults.length === 0 ? (
          <p role="status">No students found.</p>
        ) : (
          <table>
            <caption>Student exam scores</caption>
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">Student Name</th>
                <th scope="col">Score</th>
                <th scope="col">Total Marks</th>
                <th scope="col">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => (
                <tr key={result.id}>
                  <td>{index + 1}</td>
                  <td>{result.studentName}</td>
                  <td>{result.score}</td>
                  <td>{result.totalMarks}</td>
                  <td>
                    {((result.score / result.totalMarks) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p role="note">
        Demo data is displayed. Connect the exam results API to load real student scores.
      </p>
    </main>
  );
}

export default InstructorResults;
