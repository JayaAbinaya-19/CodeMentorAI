import { useState } from "react";
import { showToast } from "./Toast";

function Login({ onLoginSuccess, switchToRegister, switchToForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Invalid email or password");

      const data = await response.json();
      onLoginSuccess(data);
showToast(`Welcome back, ${data.name}!`, "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Log in to CodeMentor AI</h2>
      {error && <p className="error">{error}</p>}

      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Log In"}
      </button>

      <p className="switch-link">
        Don't have an account? <span onClick={switchToRegister}>Sign up</span>
      </p>
      <p className="switch-link">
        <span onClick={switchToForgot}>Forgot your password?</span>
      </p>
    </form>
  );
}

export default Login;