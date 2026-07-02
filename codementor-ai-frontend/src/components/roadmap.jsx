import { useState, useEffect } from "react";

const TOPICS = [
  {
    category: "Data Structures",
    items: ["Arrays", "Strings", "Linked Lists", "Stacks", "Queues", "Trees", "Graphs", "Heaps", "Hash Tables"]
  },
  {
    category: "Algorithms",
    items: ["Sorting", "Searching", "Recursion", "Dynamic Programming", "Greedy Algorithms", "Backtracking", "Two Pointers", "Sliding Window"]
  },
  {
    category: "CS Fundamentals",
    items: ["Operating Systems", "Database Management (DBMS)", "Computer Networks", "Object Oriented Programming", "System Design Basics"]
  },
  {
    category: "Language Concepts",
    items: ["Pointers & Memory", "Exception Handling", "File I/O", "Multithreading", "Collections & Generics"]
  }
];

const STATUS = ["Not Started", "Learning", "Confident"];

const STATUS_STYLE = {
  "Not Started": "status-not-started",
  "Learning": "status-learning",
  "Confident": "status-confident"
};

const STATUS_ICON = {
  "Not Started": "○",
  "Learning": "◑",
  "Confident": "●"
};

function Roadmap({ onPractice }) {
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem("codementor_roadmap");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("codementor_roadmap", JSON.stringify(progress));
  }, [progress]);

  const cycleStatus = (topic) => {
    const current = progress[topic] || "Not Started";
    const nextIndex = (STATUS.indexOf(current) + 1) % STATUS.length;
    setProgress({ ...progress, [topic]: STATUS[nextIndex] });
  };

  const getStatus = (topic) => progress[topic] || "Not Started";

  const totalTopics = TOPICS.reduce((sum, cat) => sum + cat.items.length, 0);
  const confidentCount = Object.values(progress).filter(s => s === "Confident").length;
  const learningCount = Object.values(progress).filter(s => s === "Learning").length;
  const completionPercent = Math.round((confidentCount / totalTopics) * 100);

  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <h2>Interview Preparation Roadmap</h2>
        <p className="roadmap-subtitle">Click any topic to cycle through: Not Started → Learning → Confident</p>
      </div>

      <div className="roadmap-stats">
        <div className="roadmap-stat">
          <span className="roadmap-stat-value">{totalTopics}</span>
          <span className="roadmap-stat-label">Total Topics</span>
        </div>
        <div className="roadmap-stat">
          <span className="roadmap-stat-value" style={{ color: "var(--warn)" }}>{learningCount}</span>
          <span className="roadmap-stat-label">In Progress</span>
        </div>
        <div className="roadmap-stat">
          <span className="roadmap-stat-value" style={{ color: "var(--accent)" }}>{confidentCount}</span>
          <span className="roadmap-stat-label">Confident</span>
        </div>
        <div className="roadmap-stat">
          <span className="roadmap-stat-value">{completionPercent}%</span>
          <span className="roadmap-stat-label">Complete</span>
        </div>
      </div>

      <div className="roadmap-overall-bar">
        <div className="roadmap-overall-fill" style={{ width: `${completionPercent}%` }} />
      </div>

      <div className="roadmap-categories">
        {cat.items.map((topic) => {
  const status = getStatus(topic);
  return (
    <div key={topic} className="roadmap-item-wrap">
      <button
        className={`roadmap-item ${STATUS_STYLE[status]}`}
        onClick={() => cycleStatus(topic)}
        title={`Click to change status`}
      >
        <span className="roadmap-item-icon">{STATUS_ICON[status]}</span>
        <span className="roadmap-item-name">{topic}</span>
        <span className="roadmap-item-status">{status}</span>
      </button>
      <button
        className="practice-btn"
        onClick={() => onPractice(topic)}
        title={`Practice ${topic} in Interview Mode`}
      >
        ⚡
      </button>
    </div>
  );
})}
      </div>

      <div className="roadmap-legend">
        <span className="status-not-started legend-item">{STATUS_ICON["Not Started"]} Not Started</span>
        <span className="status-learning legend-item">{STATUS_ICON["Learning"]} Learning</span>
        <span className="status-confident legend-item">{STATUS_ICON["Confident"]} Confident</span>
      </div>
    </div>
  );
}

export default Roadmap;