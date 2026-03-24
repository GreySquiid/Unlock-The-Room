import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, validated: 0 });
  const navigate = useNavigate();

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
        <h1 style={styles.title}>Dashboard</h1>
        <div style={styles.statsGrid}>
          <StatCard label="Total levels" value={stats.total} />
          <StatCard label="Published" value={stats.published} />
          <StatCard label="Validated" value={stats.validated} />
        </div>
        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={() => navigate("/levels")}>
            Manage levels
          </button>
          <button
            style={styles.secondaryBtn}
            onClick={() => navigate("/reports")}
          >
            View reports
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={styles.cardValue}>{value}</p>
    </div>
  );
}

const styles = {
  page: { padding: "2rem 2.5rem" },
  title: { fontSize: "22px", fontWeight: "600", marginBottom: "1.5rem" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: "12px",
    marginBottom: "2rem",
    maxWidth: "600px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    padding: "1.25rem",
  },
  cardLabel: { fontSize: "13px", color: "#666", marginBottom: "6px" },
  cardValue: { fontSize: "28px", fontWeight: "600" },
  actions: { display: "flex", gap: "12px" },
  primaryBtn: {
    padding: "10px 20px",
    background: "#185FA5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "#fff",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
};

export default Dashboard;
