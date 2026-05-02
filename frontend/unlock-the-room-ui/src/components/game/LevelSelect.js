import { useState, useEffect } from "react";
import api from "../../services/api";
import { GAME_UI } from "../../gameColors";

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
    if (d === "Easy") return GAME_UI.diffEasy;
    if (d === "Medium") return GAME_UI.diffMedium;
    if (d === "Hard") return "var(--color-danger-text)";
    return GAME_UI.textMuted;
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
        <p style={{ fontSize: "10px", color: GAME_UI.accentPurple, margin: "4px 0 0", fontVariantNumeric: "tabular-nums" }}>
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
    background: GAME_UI.cardBgDeep,
    border: `1px solid ${GAME_UI.cardBorderDeep}`,
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
    color: "var(--game-text-bright)",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "0.3px",
  },
  notice: {
    fontSize: "12px",
    color: GAME_UI.textNotice,
    marginBottom: "1.25rem",
    padding: "9px 12px",
    background: GAME_UI.rowBg,
    borderRadius: "8px",
    border: `1px solid var(--game-btn-bg)`,
  },
  message: {
    color: GAME_UI.textSubtle,
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
    background: GAME_UI.rowBg,
    border: `1px solid ${GAME_UI.rowBorder}`,
    borderRadius: "10px",
    padding: "14px 10px",
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
  },
  levelCardHover: {
    background: GAME_UI.rowHoverBg,
    border: "1px solid var(--color-primary)",
    boxShadow: "0 0 12px rgba(83,74,183,0.25)",
  },
  levelLocked: { opacity: 0.35, cursor: "not-allowed" },
  levelNumber: {
    fontSize: "22px",
    fontWeight: "800",
    color: GAME_UI.accentPurple,
    marginBottom: "5px",
  },
  levelName: {
    fontSize: "10px",
    color: GAME_UI.textPlaceholder,
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
    color: GAME_UI.textDim,
    border: `1px solid ${GAME_UI.subtleBorder}`,
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default LevelSelect;
