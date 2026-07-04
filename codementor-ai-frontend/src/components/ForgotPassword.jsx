import { useState } from "react";

function ForgotPassword({ switchToLogin }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Reset your password</h2>
      {message && <p className="info">{message}</p>}

      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send reset link"}
      </button>

      <p className="switch-link">
        Remembered it? <span onClick={switchToLogin}>Back to log in</span>
      </p>
    </form>
  );
}

export default ForgotPassword;