import { useState, useEffect } from "react";

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/profile/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="profile-container"><p>Loading profile...</p></div>;
  if (!profile) return <div className="profile-container"><p className="error">Could not load profile</p></div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">{profile.name?.[0]?.toUpperCase() || "?"}</div>
        <div>
          <h2>{profile.name}</h2>
          <p className="profile-email">{profile.email}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="stat-label">Total Submissions</span>
          <span className="stat-value">{profile.total_submissions}</span>
        </div>
        <div className="profile-stat">
          <span className="stat-label">Average Quality Score</span>
          <span className="stat-value">{profile.average_score !== null ? profile.average_score : "—"}</span>
        </div>
      </div>

      {Object.keys(profile.language_counts).length > 0 && (
        <div className="profile-languages">
          <h3 className="section-label">Languages Practiced</h3>
          <div className="language-badges">
            {Object.entries(profile.language_counts).map(([lang, count]) => (
              <span key={lang} className="language-badge">{lang} × {count}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;