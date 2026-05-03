import { useNavigate } from "react-router-dom";
import { SquidCanvas } from "../components/Squid";

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.squidWrap}>
          <SquidCanvas size={64} />
        </div>
        <h1 style={styles.code}>404</h1>
        <p style={styles.message}>This room doesn't exist.</p>
        <p style={styles.sub}>
          The page you're looking for has been moved, deleted, or never existed.
        </p>
        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={() => navigate("/")}>
            Back to home
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate("/play")}>
            Play the game
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--surface-subtle)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "2rem",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border-light)",
    borderRadius: "16px",
    padding: "3rem 2.5rem",
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  squidWrap: { marginBottom: "8px" },
  code: {
    fontSize: "4rem",
    fontWeight: "800",
    color: "var(--color-primary)",
    margin: 0,
    lineHeight: 1,
    letterSpacing: "-2px",
  },
  message: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "var(--text)",
    margin: 0,
  },
  sub: {
    fontSize: "14px",
    color: "var(--text-subtle)",
    margin: 0,
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryBtn: {
    padding: "10px 20px",
    background: "var(--color-primary)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "transparent",
    color: "var(--color-primary)",
    border: "1px solid var(--color-primary)",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default NotFound;
