import { useState, useEffect } from "react";
import api from "../../services/api";

function LevelSelect({ player, settings, onPlay, onBack }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState([]);
  const [leaderboard, setLeaderboard] = useState({});

  useEffect(() => {
    fetchLevels();
    if (player) fetchScores();
    fetchLeaderboard();
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

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get("/Scores/leaderboard?take=100");
      const best = {};
      res.data.forEach((score) => {
        if (!best[score.levelId]) best[score.levelId] = score;
      });
      setLeaderboard(best);
    } catch {
      setLeaderboard({});
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
            Menu
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
              <LevelCard
                key={level.id}
                level={level}
                index={index}
                unlocked={unlocked}
                diffColor={diffColor}
                onPlay={onPlay}
                bestScore={leaderboard[level.id]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LevelCard({ level, index, unlocked, diffColor, onPlay, bestScore }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.levelCard,
        ...(unlocked ? {} : styles.levelLocked),
        ...(hovered && unlocked ? styles.levelCardHover : {}),
      }}
      onClick={() => unlocked && onPlay(level)}
      onMouseEnter={() => unlocked && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.levelNumber}>{index + 1}</div>
      <p style={styles.levelName}>{level.name}</p>
      <p style={{ ...styles.levelDiff, color: diffColor(level.difficulty) }}>
        {level.difficulty}
      </p>
      {bestScore && (
        <p style={{ fontSize: "10px", color: "#7F77DD", margin: "4px 0 0", fontVariantNumeric: "tabular-nums" }}>
          Best: {bestScore.formattedTime}
        </p>
      )}
      {!unlocked && <div style={styles.lockOverlay}>&#x1F512;</div>}
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
    background: "#1e1e32",
    border: "1px solid #333350",
    borderRadius: "16px",
    padding: "2rem",
    width: "560px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  title: {
    color: "#e8e8e8",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "0.3px",
  },
  notice: {
    fontSize: "12px",
    color: "#6a6a8a",
    marginBottom: "1.25rem",
    padding: "9px 12px",
    background: "#16162a",
    borderRadius: "8px",
    border: "1px solid #2a2a44",
  },
  message: {
    color: "#5a5a7a",
    textAlign: "center",
    padding: "2rem 0",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },
  levelCard: {
    background: "#16162a",
    border: "1px solid #2e2e4a",
    borderRadius: "10px",
    padding: "14px 10px",
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
  },
  levelCardHover: {
    background: "#1e1e38",
    border: "1px solid #534AB7",
    boxShadow: "0 0 12px rgba(83,74,183,0.25)",
  },
  levelLocked: { opacity: 0.35, cursor: "not-allowed" },
  levelNumber: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#7F77DD",
    marginBottom: "5px",
  },
  levelName: {
    fontSize: "10px",
    color: "#aaa",
    margin: "0 0 4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    letterSpacing: "0.2px",
  },
  levelDiff: { fontSize: "10px", fontWeight: "600", margin: 0 },
  lockOverlay: {
    position: "absolute",
    top: "6px",
    right: "8px",
    fontSize: "11px",
    opacity: 0.6,
  },
  backBtn: {
    padding: "6px 14px",
    background: "transparent",
    color: "#666",
    border: "1px solid #333",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default LevelSelect;
