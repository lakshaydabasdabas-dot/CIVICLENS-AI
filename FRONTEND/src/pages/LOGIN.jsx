import { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

function Login() {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
      setMessage(
        error?.response?.data?.detail || error.message || "Login failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      style={{
        maxWidth: "520px",
        margin: "0 auto",
        display: "grid",
        gap: "1rem",
        padding: "1.2rem",
        borderRadius: "22px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div>
        <div style={{ fontSize: "0.9rem", opacity: 0.78, marginBottom: "0.3rem" }}>
          CivicLens AI admin
        </div>
        <h1 style={{ margin: 0 }}>Login</h1>
        <p style={{ marginTop: "0.5rem", opacity: 0.8 }}>
          Use admin credentials to access the dashboard and complaint review pages.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.45rem" }}>
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter admin username"
            required
            style={{
              padding: "0.9rem 1rem",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.45rem" }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter admin password"
            required
            style={{
              padding: "0.9rem 1rem",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "0.95rem 1rem",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      {message ? (
        <div
          style={{
            padding: "0.9rem 1rem",
            borderRadius: "14px",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.24)",
          }}
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}

export default Login;