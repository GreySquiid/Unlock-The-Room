import { useState } from "react";
import api from "../../services/api";
import { GAME_UI } from "../../gameColors";

function GameLogin({ player, onLogin, onLogout, onBack }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (player) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>My Account</h2>
          <p style={styles.subtitle}>Logged in as</p>
          <p
            style={{
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "1.5rem",
            }}
          >
            {player.username || player.email}
          </p>
          <button style={styles.submitBtn} onClick={onLogout}>
            Log out
          </button>
          {(player.role === 'Developer' || player.Role === 'Developer') && (
            <button
              style={{ ...styles.submitBtn, background: GAME_UI.devDashBlue, marginTop: '8px' }}
              onClick={() => window.open('/dashboard', '_blank')}
            >
              Developer dashboard
            </button>
          )}
          <button
            style={{
              ...styles.submitBtn,
              background: "transparent",
              border: `1px solid ${GAME_UI.cardBorder}`,
              marginTop: "8px",
            }}
            onClick={onBack}
          >
            Back to menu
          </button>
        </div>
      </div>
    );
  }

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
    background: GAME_UI.cardBg,
    border: `1px solid ${GAME_UI.cardBorder}`,
    borderRadius: "16px",
    padding: "2rem",
    width: "360px",
  },
  title: {
    color: "white",
    fontSize: "22px",
    fontWeight: "600",
    margin: "0 0 4px",
  },
  subtitle: { color: GAME_UI.textMuted, fontSize: "13px", marginBottom: "1.5rem" },
  field: { marginBottom: "14px" },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "500",
    color: GAME_UI.textPlaceholder,
    marginBottom: "5px",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    background: "var(--game-bg)",
    border: `1px solid ${GAME_UI.cardBorder}`,
    borderRadius: "8px",
    color: "white",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  error: { color: "var(--color-danger)", fontSize: "13px", marginBottom: "12px" },
  submitBtn: {
    width: "100%",
    padding: "11px",
    background: "var(--color-primary)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "12px",
  },
  switchText: {
    fontSize: "13px",
    color: GAME_UI.textMuted,
    textAlign: "center",
    marginBottom: "12px",
  },
  switchLink: {
    color: GAME_UI.accentPurple,
    cursor: "pointer",
    textDecoration: "underline",
  },
  backBtn: {
    width: "100%",
    padding: "9px",
    background: "transparent",
    color: GAME_UI.textDim,
    border: `1px solid ${GAME_UI.subtleBorder}`,
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default GameLogin;
