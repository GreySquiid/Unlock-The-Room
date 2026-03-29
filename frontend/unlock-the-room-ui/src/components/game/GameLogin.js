import { useState } from "react";
import api from "../../services/api";

function GameLogin({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await api.post("/Users/login", {
          email: email.toLowerCase().trim(),
          password,
        });
        localStorage.setItem("token", res.data.token);
        onLogin({ ...res.data.user, token: res.data.token });
      } else {
        const res = await api.post("/Users/register", {
          username,
          email: email.toLowerCase().trim(),
          password,
        });
        localStorage.setItem("token", res.data.token);
        onLogin({ ...res.data.user, token: res.data.token });
      }
    } catch {
      setError(
        mode === "login"
          ? "Invalid email or password."
          : "Registration failed. Email may already be in use.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {mode === "login" ? "Log In" : "Create Account"}
        </h2>
        <p style={styles.subtitle}>Save your scores and track progress</p>

        <form onSubmit={handleSubmit} noValidate>
          {mode === "register" && (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </button>
        </form>

        <p style={styles.switchText}>
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <span
            style={styles.switchLink}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </p>

        <button style={styles.backBtn} onClick={onBack}>
          Back to menu
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#2a2a3e",
    border: "1px solid #444",
    borderRadius: "16px",
    padding: "2rem",
    width: "360px",
  },
  title: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: "600",
    margin: "0 0 4px",
  },
  subtitle: { color: "#888", fontSize: "13px", marginBottom: "1.5rem" },
  field: { marginBottom: "14px" },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "500",
    color: "#aaa",
    marginBottom: "5px",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    background: "#1a1a2e",
    border: "1px solid #444",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  error: { color: "#E24B4A", fontSize: "13px", marginBottom: "12px" },
  submitBtn: {
    width: "100%",
    padding: "11px",
    background: "#534AB7",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "12px",
  },
  switchText: {
    fontSize: "13px",
    color: "#888",
    textAlign: "center",
    marginBottom: "12px",
  },
  switchLink: {
    color: "#7F77DD",
    cursor: "pointer",
    textDecoration: "underline",
  },
  backBtn: {
    width: "100%",
    padding: "9px",
    background: "transparent",
    color: "#666",
    border: "1px solid #333",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default GameLogin;
