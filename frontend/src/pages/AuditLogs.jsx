import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

function AuditLogs() {
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEntries() {
      try {
        const data = await apiRequest("/admin/audit-logs?limit=100");
        if (active) setEntries(Array.isArray(data.entries) ? data.entries : []);
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load audit activity.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEntries();
    return () => {
      active = false;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) =>
      [entry.action, entry.targetType, entry.targetId, entry.actorId]
        .some((value) => String(value ?? "").toLowerCase().includes(query))
    );
  }, [entries, searchTerm]);

  return (
    <main className="report-page">
      <header className="report-header">
        <div>
          <p className="eyebrow">ADMIN WORKSPACE</p>
          <h1>Audit Activity</h1>
          <p>Recent administrative and exam lifecycle events.</p>
        </div>
      </header>

      <section className="report-panel" aria-labelledby="audit-table-heading">
        <div className="report-filters">
          <h2 id="audit-table-heading">Recent events</h2>
          <label>
            Filter activity
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Action, target, or actor ID"
            />
          </label>
        </div>

        {loading && <p className="report-state" role="status">Loading audit events...</p>}
        {!loading && error && <p className="report-state report-error" role="alert">{error}</p>}
        {!loading && !error && filteredEntries.length === 0 && (
          <p className="report-state" role="status">
            {entries.length ? "No events match this filter." : "No audit events have been recorded yet."}
          </p>
        )}
        {!loading && !error && filteredEntries.length > 0 && (
          <div className="report-table-wrap">
            <table className="report-table">
              <caption>Most recent audit events</caption>
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Action</th>
                  <th scope="col">Target</th>
                  <th scope="col">Actor ID</th>
                  <th scope="col">Request ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry._id ?? `${entry.requestId}-${entry.action}`}>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td><span className="activity-badge">{entry.action}</span></td>
                    <td>{entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ""}</td>
                    <td>{entry.actorId ?? "System"}</td>
                    <td>{entry.requestId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AuditLogs;
