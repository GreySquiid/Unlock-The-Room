import { useState, useEffect } from "react";
import api from "../../services/api";
import { GAME_UI } from "../../gameColors";
import ParallaxBackground from "./ParallaxBackground";
import LevelThumbnail from "./LevelThumbnail";
import { SquidCanvas as SquidAnimated, SquidStatic } from "../../components/Squid";

function LevelSelect({ player, settings, onPlay, onBack }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState([]);
  const [myBestTimes, setMyBestTimes] = useState({});
  const [levelDetails, setLevelDetails] = useState({});
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    fetchLevels();
    if (player) {
      fetchScores();
      fetchSaved();
    }
  }, [player]);

  const fetchLevels = async () => {
    try {
      const res = await api.get("/Levels");
      const published = res.data.filter((l) => l.isPublished);
      setLevels(published);
      setLoading(false);

      // Kick off parallel detail fetches — each resolves incrementally
      for (const level of published) {
        api.get(`/Levels/${level.id}/detail`)
          .then((r) => setLevelDetails((prev) => ({ ...prev, [level.id]: r.data })))
          .catch(() => {}); // silently skip — thumbnail just stays as skeleton
      }
    } catch {
      setLevels([]);
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      const res = await api.get("/SavedLevels");
      setSavedIds(new Set(res.data.map((sl) => sl.levelId)));
    } catch {
      setSavedIds(new Set());
    }
  };

  const fetchScores = async () => {
    try {
      const res = await api.get("/Scores/mine");
      const scores = res.data;
      setCompletedIds([...new Set(scores.map((s) => s.levelId))]);

      // Personal best per level (minimum completionTimeSeconds)
      const bests = {};
      for (const s of scores) {
        if (!bests[s.levelId] || s.completionTimeSeconds < bests[s.levelId].completionTimeSeconds) {
          bests[s.levelId] = s;
        }
      }
      setMyBestTimes(bests);
    } catch {
      setCompletedIds([]);
      setMyBestTimes({});
    }
  };

  const isUnlocked = (index) => {
    if (index === 0) return true;
    return completedIds.includes(levels[index - 1]?.id);
  };

  const diffColor = (d) => {
    if (d === "Easy")   return GAME_UI.diffEasy;
    if (d === "Medium") return GAME_UI.diffMedium;
    if (d === "Hard")   return "var(--color-danger-text)";
    return GAME_UI.textMuted;
  };

  return (
    <>
      <ParallaxBackground />

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.titleRow}>
              <SquidStatic size={28} />
              <h2 style={styles.title}>Select Level</h2>
            </div>
            <button style={styles.backBtn} onClick={onBack}>
              Menu
            </button>
          </div>

          {!player && (
            <p style={styles.notice}>
              Log in to track your progress and unlock levels
            </p>
          )}

          {loading && (
            <div style={styles.loadingState}>
              <SquidAnimated size={48} />
              <p style={styles.loadingLabel}>Loading levels…</p>
            </div>
          )}
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
                  isSaved={player ? savedIds.has(level.id) : false}
                  diffColor={diffColor}
                  onPlay={onPlay}
                  myBest={player ? myBestTimes[level.id] : null}
                  detail={levelDetails[level.id] || null}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function LevelCard({ level, index, unlocked, isSaved, diffColor, onPlay, myBest, detail }) {
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
      {/* Thumbnail — skeleton while detail is loading */}
      {detail ? (
        <LevelThumbnail
          gameObjects={detail.gameObjects}
          rows={detail.rows}
          columns={detail.columns}
        />
      ) : (
        <div style={styles.thumbnailSkeleton} />
      )}

      <div style={styles.levelNumber}>{index + 1}</div>
      <p style={styles.levelName}>{level.name}</p>
      <p style={{ ...styles.levelDiff, color: diffColor(level.difficulty) }}>
        {level.difficulty}
      </p>

      {myBest && (
        <p style={styles.bestTime}>Best: {myBest.formattedTime}</p>
      )}

      {/* Saved-level bookmark — top-right, shown only when in player's saved list */}
      {isSaved && (
        <span style={styles.savedBookmark}>
          <svg width="9" height="12" viewBox="0 0 9 12" fill={GAME_UI.accentPurple}>
            <path d="M1 0h7a1 1 0 0 1 1 1v11L4.5 8.5 0 12V1a1 1 0 0 1 1-1z" />
          </svg>
        </span>
      )}

      {/* Lock indicator — visible white */}
      {!unlocked && (
        <span style={styles.lockOverlay}>&#x1F512;</span>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    minHeight: "100vh",
  },
  card: {
    background: GAME_UI.cardBgDeep,
    border: `1px solid ${GAME_UI.cardBorderDeep}`,
    borderRadius: "16px",
    padding: "2rem",
    width: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "2rem 0",
  },
  loadingLabel: {
    color: GAME_UI.textSubtle,
    fontSize: "13px",
    margin: 0,
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
    padding: "10px 8px",
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
  levelLocked: { opacity: 0.5, cursor: "not-allowed" },
  thumbnailSkeleton: {
    width: "100%",
    height: "50px",
    borderRadius: "4px",
    background: "rgba(255,255,255,0.04)",
    marginBottom: "6px",
  },
  levelNumber: {
    fontSize: "22px",
    fontWeight: "800",
    color: GAME_UI.accentPurple,
    marginBottom: "4px",
  },
  levelName: {
    fontSize: "10px",
    color: GAME_UI.textPlaceholder,
    margin: "0 0 3px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    letterSpacing: "0.2px",
  },
  levelDiff: { fontSize: "10px", fontWeight: "600", margin: 0 },
  bestTime: {
    fontSize: "10px",
    color: GAME_UI.accentPurple,
    margin: "3px 0 0",
    fontVariantNumeric: "tabular-nums",
  },
  savedBookmark: {
    position: "absolute",
    top: "5px",
    right: "6px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
  },
  lockOverlay: {
    position: "absolute",
    top: "6px",
    right: "7px",
    fontSize: "12px",
    lineHeight: 1,
    filter: "grayscale(1) brightness(5)",
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
