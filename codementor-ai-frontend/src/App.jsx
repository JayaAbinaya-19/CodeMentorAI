import { useState, useEffect } from "react";
import Auth from "./components/Auth";
import CodeEditor from "./components/CodeEditor";
import LearningAssistant from "./components/learningAssistant";
import History from "./components/History";
import Profile from "./components/profile";
import InterviewMode from "./components/InterviewMode";
import Toast from "./components/Toast";
import "./theme.css";
import "./auth.css";
import "./editor.css";
import "./learning.css";
import "./history.css";
import "./profile.css";
import "./interview.css";
import "./toast.css";

const NAV_ITEMS = [
  { key: "editor", label: "Code Editor" },
  { key: "learning", label: "Learning Assistant" },
  { key: "history", label: "History" },
  { key: "profile", label: "Profile" },
  { key: "interview", label: "Interview" },
];

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("editor");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("codementor_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setCheckingAuth(false);
  }, []);

  const handleAuthSuccess = (data) => {
    setUser(data);
    localStorage.setItem("codementor_user", JSON.stringify(data));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("codementor_user");
  };

  const navigateTo = (key) => {
    setPage(key);
    setMenuOpen(false);
  };

  if (checkingAuth) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-shell" onClick={() => setMenuOpen(false)}>

      <header className="app-header" onClick={(e) => e.stopPropagation()}>
        <h1>CodeMentor AI</h1>

        <div className="nav-right">
          <span className="welcome-text">Welcome, {user.name}</span>

          <div className="hamburger-wrapper">
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            {menuOpen && (
              <div className="nav-dropdown">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    className={
                      page === item.key
                        ? "nav-dropdown-item active"
                        : "nav-dropdown-item"
                    }
                    onClick={() => navigateTo(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="nav-dropdown-divider" />
                <button
                  className="nav-dropdown-item logout"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="page-label">
        {NAV_ITEMS.find((i) => i.key === page)?.label}
      </div>

      {page === "editor" && (
        <CodeEditor user={user} />
      )}

      {page === "learning" && (
        <LearningAssistant />
      )}

      {page === "history" && (
        <History user={user} />
      )}

      {page === "profile" && (
        <Profile user={user} />
      )}

      {page === "interview" && (
        <InterviewMode />
      )}

      <Toast />

    </div>
  );
}

export default App;