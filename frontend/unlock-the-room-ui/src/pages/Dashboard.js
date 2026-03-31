import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, validated: 0 });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/Levels");
      const levels = res.data;
      setStats({
        total: levels.length,
        published: levels.filter((l) => l.isPublished).length,
        validated: levels.filter((l) => l.isValidated).length,
      });
    } catch {
      navigate("/login");
    }
  };

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.welcome}>
              Welcome back{user.email ? `, ${user.email}` : ""}.
            </p>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <StatCard
            label="Total levels"
            value={stats.total}
            accent="#185FA5"
            description="All levels in the system"
          />
          <StatCard
            label="Published"
            value={stats.published}
            accent="#2e7d32"
            description="Visible to players"
          />
          <StatCard
            label="Validated"
            value={stats.validated}
            accent="#534AB7"
            description="Marked as ready"
          />
        </div>

        <div style={styles.actionsSection}>
          <p style={styles.actionsLabel}>Quick actions</p>
          <div style={styles.actions}>
            <ActionButton
              label="Manage levels"
              description="Create, edit, reorder, and publish levels"
              onClick={() => navigate("/levels")}
              primary
            />
            <ActionButton
              label="AI Generator"
              description="Generate a new level with AI assistance"
              onClick={() => navigate("/ai-generator")}
            />
            <ActionButton
              label="View reports"
              description="Level inventory and analytics"
              onClick={() => navigate("/reports")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, description }) {
  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${accent}` }}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={{ ...styles.cardValue, color: accent }}>{value}</p>
      {description && <p style={styles.cardDescription}>{description}</p>}
    </div>
  );
}

function ActionButton({ label, description, onClick, primary }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        ...styles.actionBtn,
        ...(primary ? styles.actionBtnPrimary : {}),
        ...(hovered ? (primary ? styles.actionBtnPrimaryHover : styles.actionBtnHover) : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={styles.actionBtnLabel}>{label}</span>
      <span style={styles.actionBtnDesc}>{description}</span>
    </button>
  );
}

const styles = {
  page: { padding: "2rem 2.5rem", maxWidth: "800px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
  title: { fontSize: "22px", fontWeight: "700", marginBottom: "4px", letterSpacing: "-0.2px" },
  welcome: { fontSize: "13px", color: "#999" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: "12px",
    marginBottom: "2.5rem",
  },
  card: {
    background: "#fff",
    border: "1px solid #e8e8e8",
    borderRadius: "10px",
    padding: "1.25rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  cardLabel: {
    fontSize: "11px",
    color: "#999",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "600",
  },
  cardValue: { fontSize: "32px", fontWeight: "700", marginBottom: "4px" },
  cardDescription: { fontSize: "12px", color: "#bbb", marginTop: "4px" },
  actionsSection: { marginBottom: "2rem" },
  actionsLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "10px",
  },
  actions: { display: "flex", gap: "10px" },
  actionBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "3px",
    padding: "14px 18px",
    background: "#fff",
    color: "#333",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    transition: "border-color 0.15s, box-shadow 0.15s",
    minWidth: "160px",
  },
  actionBtnHover: {
    borderColor: "#aaa",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  actionBtnPrimary: {
    background: "#185FA5",
    color: "#fff",
    border: "1px solid #185FA5",
  },
  actionBtnPrimaryHover: {
    background: "#124d89",
    borderColor: "#124d89",
    boxShadow: "0 2px 10px rgba(24,95,165,0.3)",
  },
  actionBtnLabel: { fontSize: "13px", fontWeight: "600" },
  actionBtnDesc: { fontSize: "11px", opacity: 0.6 },
};

export default Dashboard;
