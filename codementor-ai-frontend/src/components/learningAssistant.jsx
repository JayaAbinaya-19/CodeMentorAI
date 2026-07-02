import { useState } from "react";

const COMPANIES = [
  "General", "TCS", "Infosys", "Wipro", "Cognizant",
  "Accenture", "Google", "Amazon", "Microsoft", "Meta"
];

function LearningAssistant() {
  const [mode, setMode] = useState("quiz");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("Python");
  const [company, setCompany] = useState("General");
  const [quiz, setQuiz] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (newMode) => {
    setMode(newMode);
    setQuiz(null);
    setExplanation(null);
    setSelectedAnswers({});
    setSubmitted(false);
    setError("");
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    setError("");
    setLoading(true);
    setQuiz(null);
    setExplanation(null);
    setSelectedAnswers({});
    setSubmitted(false);

    const endpoint = mode === "quiz" ? "/api/quiz" : "/api/explain";
    const body = mode === "quiz"
      ? { topic, language, company }
      : { concept: topic, language };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      mode === "quiz" ? setQuiz(data) : setExplanation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionIndex, optionIndex) => {
    if (submitted) return;
    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: optionIndex });
  };

  const score = quiz
    ? quiz.questions.reduce(
        (t, q, i) => t + (selectedAnswers[i] === q.correct_index ? 1 : 0), 0
      )
    : 0;

  return (
    <div className="learning-container">

      <div className="mode-tabs">
        <button className={mode === "quiz" ? "tab active" : "tab"} onClick={() => switchMode("quiz")}>
          Generate Quiz
        </button>
        <button className={mode === "explain" ? "tab active" : "tab"} onClick={() => switchMode("explain")}>
          Explain a Concept
        </button>
      </div>

      {/* Topic */}
      <div style={{ marginBottom: "0.8rem" }}>
        <input
          style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px", border: "1.5px solid #e1e5ea", fontSize: "0.92rem", boxSizing: "border-box", fontFamily: "inherit" }}
          type="text"
          placeholder={mode === "quiz" ? "e.g. Recursion, For Loops, Pointers" : "e.g. What is a linked list?"}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      {/* Language */}
      <div style={{ marginBottom: "0.8rem" }}>
        <label style={{ fontSize: "0.75rem", fontFamily: "monospace", textTransform: "uppercase", color: "#5b6472", display: "block", marginBottom: "0.3rem" }}>Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1.5px solid #e1e5ea", fontSize: "0.9rem", background: "#f3f5f7", color: "#1c2129", width: "100%", boxSizing: "border-box" }}
        >
          <option value="Python">Python</option>
          <option value="Java">Java</option>
          <option value="C">C</option>
          <option value="C++">C++</option>
          <option value="JavaScript">JavaScript</option>
          <option value="C#">C#</option>
        </select>
      </div>

      {/* Company — only in quiz mode */}
      {mode === "quiz" && (
        <div style={{ marginBottom: "0.8rem" }}>
          <label style={{ fontSize: "0.75rem", fontFamily: "monospace", textTransform: "uppercase", color: "#5b6472", display: "block", marginBottom: "0.3rem" }}>Company Focus</label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{ padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1.5px solid #e1e5ea", fontSize: "0.9rem", background: "#f3f5f7", color: "#1c2129", width: "100%", boxSizing: "border-box" }}
          >
            {COMPANIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{ width: "100%", padding: "0.75rem", background: loading ? "#9aa3b0" : "#1c2129", color: "white", border: "none", borderRadius: "8px", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", marginBottom: "0.8rem" }}
      >
        {loading ? "Generating..." : mode === "quiz" ? "Generate Quiz" : "Explain"}
      </button>

      {mode === "quiz" && company !== "General" && (
        <p style={{ fontSize: "0.82rem", color: "#5b6472", fontStyle: "italic", margin: "0 0 0.8rem" }}>
          Tailored to <strong>{company}</strong> interview style
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {/* Quiz */}
      {quiz && (
        <div className="quiz-results">
          <div className="quiz-header">
            <h3>Quiz: {quiz.topic}</h3>
            {company !== "General" && (
              <span className="company-badge">{company}</span>
            )}
          </div>

          {quiz.questions.map((q, qi) => (
            <div key={qi} className="quiz-question">
              <p className="question-text">{qi + 1}. {q.question}</p>
              <div className="quiz-options">
                {q.options.map((opt, oi) => {
                  let cls = "quiz-option";
                  if (submitted) {
                    if (oi === q.correct_index) cls += " correct";
                    else if (selectedAnswers[qi] === oi) cls += " incorrect";
                  } else if (selectedAnswers[qi] === oi) {
                    cls += " selected";
                  }
                  return (
                    <div key={oi} className={cls} onClick={() => selectAnswer(qi, oi)}>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {submitted && <p className="quiz-explanation">{q.explanation}</p>}
            </div>
          ))}

          {!submitted ? (
            <button className="submit-quiz-btn" onClick={() => setSubmitted(true)}>
              Submit Quiz
            </button>
          ) : (
            <div className="quiz-score-row">
              <p className="quiz-score">Score: {score} / {quiz.questions.length}</p>
              <button className="submit-quiz-btn" onClick={() => {
                setQuiz(null);
                setSelectedAnswers({});
                setSubmitted(false);
              }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="explanation-results">
          <h3>{explanation.concept}</h3>
          <p>{explanation.simple_explanation}</p>
          <h4>Real-world analogy</h4>
          <p>{explanation.real_world_analogy}</p>
          <h4>Example</h4>
          <pre className="corrected-code">{explanation.example_code}</pre>
          <h4>Common mistakes beginners make</h4>
          <ul>
            {explanation.common_mistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LearningAssistant;