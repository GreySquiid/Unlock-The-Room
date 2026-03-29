import { useState, useEffect } from "react";
import api from "../../services/api";

function LevelSelect({ player, settings, onPlay, onBack }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState([]);

  useEffect(() => {
    fetchLevels();
    if (player) fetchScores();
  }, [player]);

  const fetchLevels = async () => {
    try {
      const res = await api.get("/Levels");
      setLevels(res.data.filter((l) => l.isPublished));
    } catch {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async () => {
    try {
      const res = await api.get("/Scores/mine");
      setCompletedIds([...new Set(res.data.map((s) => s.levelId))]);
    } catch {
      setCompletedIds([]);
    }
  };

  const isUnlocked = (index) => {
    if (index === 0) return true;
    return completedIds.includes(levels[index - 1]?.id);
  };

  const diffColor = (d) => {
    if (d === "Easy") return "#639922";
    if (d === "Medium") return "#BA7517";
    if (d === "Hard") return "#A32D2D";
    return "#888";
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Select Level</h2>
          <button style={styles.backBtn} onClick={onBack}>
            Back
          </button>
        </div>

        {!player && (
          <p style={styles.notice}>
            Log in to track your progress and unlock levels
          </p>
        )}

        {loading && <p style={styles.message}>Loading levels...</p>}
        {!loading && levels.length === 0 && (
          <p style={styles.message}>No published levels available yet.</p>
        )}

        <div style={styles.grid}>
          {levels.map((level, index) => {
            const unlocked = !player || isUnlocked(index);
            return (
              <div
                key={level.id}
                style={{
                  ...styles.levelCard,
                  ...(unlocked ? {} : styles.levelLocked),
                }}
                onClick={() => unlocked && onPlay(level)}
              >
                <div style={styles.levelNumber}>{index + 1}</div>
                <p style={styles.levelName}>{level.name}</p>
                <p
                  style={{
                    ...styles.levelDiff,
                    color: diffColor(level.difficulty),
                  }}
                >
                  {level.difficulty}
                </p>
                {!unlocked && <div style={styles.lockOverlay}>🔒</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  card: {
    background: "#2a2a3e",
    border: "1px solid #444",
    borderRadius: "16px",
    padding: "2rem",
    width: "560px",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  title: { color: "#fff", fontSize: "22px", fontWeight: "600", margin: 0 },
  notice: {
    fontSize: "13px",
    color: "#888",
    marginBottom: "1rem",
    padding: "8px 12px",
    background: "#1a1a2e",
    borderRadius: "8px",
    border: "1px solid #333",
  },
  message: {
    color: "#888",
    textAlign: "center",
    padding: "2rem 0",
    fontSize: "14px",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" },
  levelCard: {
    background: "#1a1a2e",
    border: "1px solid #444",
    borderRadius: "10px",
    padding: "14px 10px",
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
    transition: "border-color 0.15s",
  },
  levelLocked: { opacity: 0.4, cursor: "not-allowed" },
  levelNumber: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#7F77DD",
    marginBottom: "4px",
  },
  levelName: {
    fontSize: "11px",
    color: "#ccc",
    margin: "0 0 4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  levelDiff: { fontSize: "11px", fontWeight: "500", margin: 0 },
  lockOverlay: {
    position: "absolute",
    top: "6px",
    right: "8px",
    fontSize: "12px",
  },
  backBtn: {
    padding: "6px 14px",
    background: "transparent",
    color: "#888",
    border: "1px solid #444",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default LevelSelect;
