import { useState, useEffect } from "react";

function History({ user }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [tips, setTips] = useState(null);
  const [tipsLoading, setTipsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/history/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load history");
        setLoading(false);
      });
  }, [user]);

  const fetchTips = () => {
    if (!user?.id) return;
    setTipsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/learning-tips/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setTips(data);
        setTipsLoading(false);
      })
      .catch(() => setTipsLoading(false));
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
  const formatDate = (iso) => new Date(iso).toLocaleString();

  if (loading) return <div className="history-container"><p>Loading your history...</p></div>;
  if (error) return <div className="history-container"><p className="error">{error}</p></div>;

  return (
    <div className="history-container">
      <h2>Your Submission History</h2>

      {submissions.length > 0 && (
        <div className="progress-table-wrap">
          <h3 className="section-label">Progress Overview</h3>
          <table className="progress-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Language</th>
                <th>Quality Score</th>
                <th>Errors Found</th>
              </tr>
            </thead>
            <tbody>
  {submissions.map((s, i) => {
    const score = s.result?.quality?.score;
    return (
      <tr key={i}>
        <td>
          {new Date(s.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </td>
        <td><span className="history-lang-badge">{s.language}</span></td>
        <td>
          {score !== undefined
            ? <span className={`score-badge ${score < 60 ? "low" : ""}`}>{score}/100</span>
            : <span className="error-count">—</span>}
        </td>
        <td>
          <span className="error-count">{(s.result?.errors || []).length} errors</span>
        </td>
      </tr>
    );
  })}
</tbody>
          </table>
        </div>
      )}

      <button className="tips-button" onClick={fetchTips} disabled={tipsLoading}>
        {tipsLoading ? "Analyzing your patterns..." : "Get My Learning Tips"}
      </button>

      {tips && (
        <div className="tips-box">
          <h3>Your Learning Tips</h3>
          <p>{tips.pattern_summary || tips.message}</p>
          {tips.recommended_topics && (
            <ul className="tips-topics">
              {tips.recommended_topics.map((t, i) => <li key={i}>✓ {t}</li>)}
            </ul>
          )}
        </div>
      )}

      {submissions.length === 0 ? (
        <p className="empty-state">No submissions yet — analyze some code to see it appear here.</p>
      ) : (
        <div className="history-list">
          {submissions.map((s) => (
            <div key={s.id} className="history-item">
              <div className="history-item-header" onClick={() => toggleExpand(s.id)}>
                <span className="history-lang-badge">{s.language}</span>
                <span className="history-snippet">
                  {s.code.split("\n")[0].slice(0, 60)}{s.code.length > 60 ? "..." : ""}
                </span>
                <span className="history-date">{formatDate(s.created_at)}</span>
              </div>
              {expandedId === s.id && (
                <div className="history-item-details">
                  <h4>Code Submitted</h4>
                  <pre className="corrected-code">{s.code}</pre>
                  <h4>Errors Found</h4>
                  <ul>
                    {(s.result.errors || []).map((e, i) => (
                      <li key={i}>{typeof e === "string" ? e : JSON.stringify(e)}</li>
                    ))}
                  </ul>
                  <h4>Explanation</h4>
                  <p>{s.result.explanation}</p>
                  <h4>Corrected Code</h4>
                  <pre className="corrected-code">{s.result.corrected_code}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;