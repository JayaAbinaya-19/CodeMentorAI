import { useState } from "react";
import Login from "./login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";

function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"

  return (
    <div className="auth-page">
      {mode === "login" && (
        <Login
          onLoginSuccess={onAuthSuccess}
          switchToRegister={() => setMode("register")}
          switchToForgot={() => setMode("forgot")}
        />
      )}
      {mode === "register" && (
        <Register onRegisterSuccess={onAuthSuccess} switchToLogin={() => setMode("login")} />
      )}
      {mode === "forgot" && <ForgotPassword switchToLogin={() => setMode("login")} />}
    </div>
  );
}

export default Auth;