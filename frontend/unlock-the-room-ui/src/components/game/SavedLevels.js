import { useState, useEffect } from "react";
import api from "../../services/api";
import { GAME_UI } from "../../gameColors";

function SavedLevels({ player, onPlay, onBack }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState({});

  useEffect(() => {
    if (player) fetchSaved();
    api.get('/Scores/leaderboard?take=100').then(res => {
      const best = {};
      res.data.forEach(score => {
        if (!best[score.levelId]) best[score.levelId] = score;
      });
      setLeaderboard(best);
    }).catch(() => {});
  }, [player]);

  const fetchSaved = async () => {
    try {
      const res = await api.get("/SavedLevels");
      setSaved(res.data);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (levelId) => {
    await api.delete(`/SavedLevels/${levelId}`);
    setSaved((prev) => prev.filter((s) => s.levelId !== levelId));
  };

  if (!player) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.locked}>🔒 Log in to view your saved levels</p>
          <button style={styles.backBtn} onClick={onBack}>
            Back to menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Saved Levels</h2>
          <button style={styles.backBtn} onClick={onBack}>
            Back
          </button>
        </div>

        {loading && <p style={styles.message}>Loading...</p>}
        {!loading && saved.length === 0 && (
          <p style={styles.message}>
            No saved levels yet. Save levels while playing to find them here.
          </p>
        )}

        <div style={styles.list}>
          {saved.map((item) => (
            <div key={item.id} style={styles.row}>
              <div>
                <p style={styles.levelName}>{item.levelName}</p>
                <p style={styles.levelMeta}>
                  {item.difficulty}
                  {leaderboard[item.levelId] ? ` · Best: ${leaderboard[item.levelId].formattedTime}` : ''}
                </p>
              </div>
              <div style={styles.rowActions}>
                <button
                  style={styles.playBtn}
                  onClick={() =>
                    onPlay({
                      id: item.levelId,
                      name: item.levelName,
                      difficulty: item.difficulty,
                      rows: item.rows,
                      columns: item.columns,
                    })
                  }
                >
                  Play
                </button>
                <button
                  style={styles.unsaveBtn}
                  onClick={() => handleUnsave(item.levelId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
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
    background: GAME_UI.cardBg,
    border: `1px solid ${GAME_UI.cardBorder}`,
    borderRadius: "16px",
    padding: "2rem",
    width: "480px",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: { color: "white", fontSize: "22px", fontWeight: "600", margin: 0 },
  locked: {
    color: GAME_UI.textMuted,
    textAlign: "center",
    padding: "2rem 0",
    fontSize: "16px",
  },
  message: {
    color: GAME_UI.textMuted,
    textAlign: "center",
    padding: "1.5rem 0",
    fontSize: "14px",
  },
  list: { display: "flex", flexDirection: "column", gap: "8px" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    background: "var(--game-bg)",
    borderRadius: "8px",
    border: `1px solid ${GAME_UI.subtleBorder}`,
  },
  levelName: { color: "white", fontSize: "14px", fontWeight: "500", margin: 0 },
  levelMeta: { color: GAME_UI.textMuted, fontSize: "12px", margin: "3px 0 0" },
  rowActions: { display: "flex", gap: "8px" },
  playBtn: {
    padding: "6px 14px",
    background: "var(--color-primary)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  unsaveBtn: {
    padding: "6px 14px",
    background: "transparent",
    color: GAME_UI.textMuted,
    border: `1px solid ${GAME_UI.cardBorder}`,
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  backBtn: {
    padding: "6px 14px",
    background: "transparent",
    color: GAME_UI.textMuted,
    border: `1px solid ${GAME_UI.cardBorder}`,
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default SavedLevels;
