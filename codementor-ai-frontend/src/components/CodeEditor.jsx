import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { showToast } from "./Toast";

const getLanguageExtension = (lang) => {
  switch (lang) {
    case "Python": return python();
    case "Java": return java();
    case "C":
    case "C++":
    case "C#": return cpp();
    case "JavaScript": return javascript();
    default: return python();
  }
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Copy failed — try selecting manually", "error");
    }
  };

  return (
    <button className="copy-btn" onClick={handleCopy}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function CodeEditor({ user }) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setCode("");
    setResult(null);
    setError("");
  };

  const handleClear = () => {
    setCode("");
    setResult(null);
    setError("");
    showToast("Editor cleared", "info");
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("Please paste some code first");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, user_id: user?.id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      setResult(data);
      showToast("Analysis complete!", "success");
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>Submit Your Code</h2>
        <select value={language} onChange={handleLanguageChange}>
          <option value="Python">Python</option>
          <option value="Java">Java</option>
          <option value="C">C</option>
          <option value="C++">C++</option>
          <option value="JavaScript">JavaScript</option>
          <option value="C#">C#</option>
        </select>
      </div>

      <div className="code-editor-wrapper">
        <CodeMirror
  value={code}
  height="320px"
  theme={oneDark}
  extensions={[getLanguageExtension(language)]}
  onChange={(value) => setCode(value)}
  placeholder={`Paste your ${language} code here...`}
  basicSetup={{
    autocompletion: false,
    foldGutter: false,
  }}
/>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="editor-actions">
        <button onClick={handleSubmit} disabled={loading} className="analyze-btn">
          {loading ? "Analyzing..." : "Analyze My Code"}
        </button>
        <button onClick={handleClear} className="clear-btn" type="button">
          Clear
        </button>
      </div>

      {result && (
        <div className="results">

          <h3 className="section-label warn">Errors Found</h3>
          <ul>
            {(result.errors || []).map((e, i) => (
              <li key={i}>{typeof e === "string" ? e : JSON.stringify(e)}</li>
            ))}
          </ul>

          <h3 className="section-label">Explanation</h3>
          <p>{result.explanation || "No explanation provided."}</p>

          <h3 className="section-label accent">Suggested Fixes</h3>
          <ul>
            {(result.suggestions || []).map((s, i) => (
              <li key={i}>{typeof s === "string" ? s : JSON.stringify(s)}</li>
            ))}
          </ul>

          <h3 className="section-label">Corrected Code</h3>
          <div className="code-block-wrapper">
            <CopyButton text={result.corrected_code || ""} />
            <pre className="corrected-code">
              {result.corrected_code || "No corrected code provided."}
            </pre>
          </div>

          {result.complexity && (
            <>
              <h3 className="section-label">Complexity Analysis</h3>
              <div className="stat-cards">
                <div className="stat-card">
                  <span className="stat-label">Time Complexity</span>
                  <span className="stat-value">{result.complexity.time_complexity}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Space Complexity</span>
                  <span className="stat-value">{result.complexity.space_complexity}</span>
                </div>
              </div>
              {result.complexity.note && (
                <p className="stat-note">{result.complexity.note}</p>
              )}
            </>
          )}

          {result.quality && (
            <>
              <h3 className="section-label accent">Code Quality Score</h3>
              <div className="quality-score-row">
                <div className="quality-score-circle">{result.quality.score}</div>
                <div className="quality-breakdown">
                  <div>
                    <span>Readability</span>
                    <strong>{result.quality.readability}</strong>
                  </div>
                  <div>
                    <span>Efficiency</span>
                    <strong>{result.quality.efficiency}</strong>
                  </div>
                  <div>
                    <span>Naming Convention</span>
                    <strong>{result.quality.naming_convention}</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          <h3 className="section-label">Practice Interview Questions</h3>
          <ol>
            {(result.interview_questions || []).map((q, i) => (
              <li key={i}>{typeof q === "string" ? q : JSON.stringify(q)}</li>
            ))}
          </ol>

        </div>
      )}
    </div>
  );
}

export default CodeEditor;