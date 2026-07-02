import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

const TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Stacks", "Queues",
  "Trees", "Graphs", "Dynamic Programming", "Recursion",
  "Sorting", "Searching", "Hash Tables", "Greedy Algorithms"
];

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

const VERDICT_STYLE = {
  "Accepted": "verdict-accepted",
  "Wrong Answer": "verdict-wrong",
  "Incomplete": "verdict-incomplete"
};

function InterviewMode() {
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState("Easy");
  const [language, setLanguage] = useState("Python");
  const [problem, setProblem] = useState(null);
  const [solution, setSolution] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const generateProblem = async () => {
    setError("");
    setGenerating(true);
    setProblem(null);
    setEvaluation(null);
    setSolution("");
    setShowHints(false);

    try {
      const response = await fetch("http://localhost:5000/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate problem");
      setProblem(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const evaluateSolution = async () => {
    if (!solution.trim()) {
      setError("Please write your solution first");
      return;
    }
    setError("");
    setEvaluating(true);
    setEvaluation(null);

    try {
      const response = await fetch("http://localhost:5000/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, solution, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Evaluation failed");
      setEvaluation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="interview-container">

      {/* Step 1 — Configuration */}
      <div className="interview-config">
        <h2>Interview Mode</h2>
        <p className="roadmap-subtitle">
          Generate a real coding problem and get evaluated like a real interview
        </p>

        <div className="interview-config-row">
          <label>
            Topic
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>
          <label>
            Language
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setSolution("");
              }}
            >
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="C">C</option>
              <option value="C++">C++</option>
              <option value="JavaScript">JavaScript</option>
              <option value="C#">C#</option>
            </select>
          </label>
          <button
            className="generate-btn"
            onClick={generateProblem}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Problem"}
          </button>
        </div>
      </div>

      {error && (
        <p className="error" style={{ padding: "0 2rem" }}>{error}</p>
      )}

      {/* Step 2 — Problem Statement */}
      {problem && (
        <div className="interview-problem">
          <div className="problem-title-row">
            <h3>{problem.title}</h3>
            <div className="problem-badges">
              <span className={`difficulty-badge ${problem.difficulty?.toLowerCase()}`}>
                {problem.difficulty}
              </span>
              <span className="topic-badge">{problem.topic}</span>
            </div>
          </div>

          <p className="problem-statement">{problem.problem_statement}</p>

          <div className="problem-meta">
            <div>
              <h4>Input Format</h4>
              <p>{problem.input_format}</p>
            </div>
            <div>
              <h4>Output Format</h4>
              <p>{problem.output_format}</p>
            </div>
          </div>

          {problem.constraints?.length > 0 && (
            <div className="problem-section">
              <h4>Constraints</h4>
              <ul>
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {problem.examples?.length > 0 && (
            <div className="problem-section">
              <h4>Examples</h4>
              {problem.examples.map((ex, i) => (
                <div key={i} className="example-block">
                  <div className="example-row">
                    <span>Input:</span>
                    <code>{ex.input}</code>
                  </div>
                  <div className="example-row">
                    <span>Output:</span>
                    <code>{ex.output}</code>
                  </div>
                  {ex.explanation && (
                    <p className="example-explanation">{ex.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {problem.hints?.length > 0 && (
            <div className="problem-section">
              <button
                className="hint-toggle"
                onClick={() => setShowHints(!showHints)}
              >
                {showHints ? "Hide Hints" : "Show Hints"}
              </button>
              {showHints && (
                <ol className="hints-list">
                  {problem.hints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Code Editor */}
      {problem && (
        <div className="interview-editor">
          <div className="interview-editor-header">
            <h3>Your Solution</h3>
            <span className="interview-lang-label">{language}</span>
          </div>
          <div className="code-editor-wrapper">
            <CodeMirror
              value={solution}
              height="300px"
              theme={oneDark}
              extensions={[getLanguageExtension(language)]}
              onChange={(value) => setSolution(value)}
              placeholder={`Write your ${language} solution here...`}
            />
          </div>
          <div className="interview-editor-actions">
            <button
              className="analyze-btn"
              onClick={evaluateSolution}
              disabled={evaluating}
            >
              {evaluating ? "Evaluating..." : "Submit Solution"}
            </button>
            <button
              className="clear-btn"
              onClick={() => {
                setSolution("");
                setEvaluation(null);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Evaluation Results */}
      {evaluation && (
        <div className="interview-evaluation">
          <div className="evaluation-header">
            <span className={`verdict-badge ${VERDICT_STYLE[evaluation.verdict] || ""}`}>
              {evaluation.verdict}
            </span>
            <span className="evaluation-score">{evaluation.score}/100</span>
          </div>

          <p className="interviewer-feedback">
            {evaluation.interviewer_feedback}
          </p>

          <div className="evaluation-grid">
            <div className="eval-section">
              <h4 className="section-label accent">Strengths</h4>
              <ul>
                {(evaluation.strengths || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="eval-section">
              <h4 className="section-label warn">Improvements</h4>
              <ul>
                {(evaluation.improvements || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="stat-cards" style={{ marginTop: "1rem" }}>
            <div className="stat-card">
              <span className="stat-label">Time Complexity</span>
              <span className="stat-value">
                {evaluation.time_complexity?.split(" ")[0]}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Space Complexity</span>
              <span className="stat-value">
                {evaluation.space_complexity?.split(" ")[0]}
              </span>
            </div>
          </div>

          <div className="optimal-approach">
            <h4 className="section-label">Optimal Approach</h4>
            <p>{evaluation.optimal_approach}</p>
          </div>

          <button
            className="generate-btn"
            style={{ marginTop: "1rem" }}
            onClick={generateProblem}
          >
            Try Another Problem
          </button>
        </div>
      )}
    </div>
  );
}

export default InterviewMode;