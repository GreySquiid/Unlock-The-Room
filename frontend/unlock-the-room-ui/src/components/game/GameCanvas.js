import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../services/api";

const TILE = 40;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4;
const COLORS = {
  Red: "#E24B4A",
  Blue: "#378ADD",
  Green: "#639922",
  Yellow: "#EF9F27",
  Purple: "#7F77DD",
  White: "#E8E8E8",
};

function GameCanvas({ level, player, settings, onComplete, onMenu }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const keysRef = useRef({});
  const [paused, setPaused] = useState(false);
  const [hudData, setHudData] = useState({
    time: 0,
    keysCollected: 0,
    totalKeys: 0,
  });
  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const pausedRef = useRef(false);

  const loadLevel = useCallback(async () => {
    try {
      const res = await api.get(`/Levels/${level.id}/detail`);
      const data = res.data;
      setLevelData(data);

      const gameObjects = data.gameObjects || [];
      const aiPlatforms = gameObjects
        .filter(o => o.objectType === 'Platform' ||
                    (o.objectType === 'Hazard' && o.hazardType === 'Platform'))
        .map(o => ({
          x: o.positionX * TILE, y: o.positionY * TILE,
          w: o.width * TILE, h: o.height * TILE
        }));
      const platforms = [...buildPlatforms(data.rows, data.columns), ...aiPlatforms];
      const keys = gameObjects
        .filter((o) => o.objectType === "Key")
        .map((o) => ({
          ...o,
          collected: false,
          x: o.positionX * TILE,
          y: o.positionY * TILE,
          w: TILE,
          h: TILE,
        }));
      const barriers = gameObjects
        .filter((o) => o.objectType === "Barrier")
        .map((o) => ({
          ...o,
          unlocked: false,
          x: o.positionX * TILE,
          y: o.positionY * TILE,
          w: o.width * TILE,
          h: o.height * TILE,
        }));
      const hazards = gameObjects
        .filter((o) => o.objectType === "Hazard")
        .map((o) => ({
          ...o,
          x: o.positionX * TILE,
          y: o.positionY * TILE,
          w: o.width * TILE,
          h: o.height * TILE,
        }));
      const exitDoors = gameObjects
        .filter((o) => o.objectType === "ExitDoor")
        .map((o) => ({
          ...o,
          x: o.positionX * TILE,
          y: o.positionY * TILE,
          w: o.width * TILE,
          h: o.height * TILE,
        }));

      const spawnPoint = gameObjects.find(o => o.objectType === 'SpawnPoint');
      const spawnX = spawnPoint ? spawnPoint.positionX * TILE : TILE;
      const spawnY = spawnPoint ? spawnPoint.positionY * TILE : (data.rows - 3) * TILE;

      stateRef.current = {
        player: {
          x: spawnX,
          y: spawnY,
          w: 28,
          h: 36,
          vx: 0,
          vy: 0,
          onGround: false,
        },
        platforms,
        keys,
        barriers,
        hazards,
        exitDoors,
        spawnX,
        spawnY,
        startTime: Date.now(),
        elapsedSeconds: 0,
        cols: data.columns,
        rows: data.rows,
      };
      setHudData({ time: 0, keysCollected: 0, totalKeys: keys.length });
      setLoading(false);
    } catch (err) {
      console.error("Failed to load level", err);
      setLoading(false);
    }
  }, [level.id]);

  const buildPlatforms = (rows, cols) => {
    const platforms = [];
    // Ground
    platforms.push({ x: 0, y: (rows - 1) * TILE, w: cols * TILE, h: TILE });
    // Left wall
    platforms.push({ x: 0, y: 0, w: TILE, h: rows * TILE });
    // Right wall
    platforms.push({ x: (cols - 1) * TILE, y: 0, w: TILE, h: rows * TILE });
    // Some generated platforms for playability
    const spacing = Math.floor(cols / 4);
    for (let i = 1; i < 4; i++) {
      const px = i * spacing * TILE;
      const py = (rows - 3 - (i % 2)) * TILE;
      platforms.push({ x: px, y: py, w: TILE * 3, h: TILE });
    }
    return platforms;
  };

  useEffect(() => {
    loadLevel();
  }, [loadLevel]);

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.code] = true;
      if (e.code === "Escape") {
        pausedRef.current = !pausedRef.current;
        setPaused((p) => !p);
      }
      if (
        ["Space", "ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
    };
    const up = (e) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (loading || !stateRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (pausedRef.current) return;
      update(stateRef.current, keysRef.current);
      draw(ctx, stateRef.current, settings);
      const s = stateRef.current;
      const collected = s.keys.filter((k) => k.collected).length;
      const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
      s.elapsedSeconds = elapsed;
      setHudData({
        time: elapsed,
        keysCollected: collected,
        totalKeys: s.keys.length,
      });
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loading, settings]);

  const update = (s, keys) => {
    const p = s.player;

    // Movement
    p.vx = 0;
    if (keys["ArrowLeft"] || keys["KeyA"]) p.vx = -MOVE_SPEED;
    if (keys["ArrowRight"] || keys["KeyD"]) p.vx = MOVE_SPEED;
    if ((keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) && p.onGround) {
      p.vy = JUMP_FORCE;
      p.onGround = false;
    }

    // Gravity
    p.vy += GRAVITY;

    // Platform collision
    p.onGround = false;
    const allSolids = [
      ...s.platforms,
      ...s.barriers.filter((b) => !b.unlocked),
    ];

    // Horizontal collision
    p.x += p.vx;
    for (const plat of allSolids) {
      if (rectsOverlap(p, plat)) {
        if (p.vx > 0) p.x = plat.x - p.w;
        else if (p.vx < 0) p.x = plat.x + plat.w;
        p.vx = 0;
      }
    }

    // Vertical collision
    p.y += p.vy;
    for (const plat of allSolids) {
      if (rectsOverlap(p, plat)) {
        if (p.vy > 0) {
          p.y = plat.y - p.h;
          p.onGround = true;
        } else if (p.vy < 0) {
          p.y = plat.y + plat.h;
        }
        p.vy = 0;
      }
    }

    // Bounds
    const maxX = s.cols * TILE - p.w;
    const maxY = s.rows * TILE - p.h;
    if (p.x < 0) p.x = 0;
    if (p.x > maxX) p.x = maxX;
    if (p.y > maxY) {
      p.y = maxY;
      p.vy = 0;
      p.onGround = true;
    }

    // Key collection
    for (const key of s.keys) {
      if (!key.collected && rectsOverlap(p, key)) {
        key.collected = true;
        for (const barrier of s.barriers) {
          if (barrier.color === key.color) barrier.unlocked = true;
        }
      }
    }

    // Hazard collision — respawn
    for (const hazard of s.hazards) {
      if (hazard.hazardType === 'Platform') continue;
      if (rectsOverlap(p, hazard)) {
        p.x = s.spawnX;
        p.y = s.spawnY;
        p.vx = 0;
        p.vy = 0;
        for (const key of s.keys) key.collected = false;
        for (const barrier of s.barriers) barrier.unlocked = false;
      }
    }

    // Exit door
    const allKeysCollected = s.keys.every((k) => k.collected);
    for (const door of s.exitDoors) {
      if (allKeysCollected && rectsOverlap(p, door)) {
        s.levelComplete = true;
      }
    }
  };

  const draw = (ctx, s, settings) => {
    const W = s.cols * TILE;
    const H = s.rows * TILE;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, W, H);

    // Grid lines (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= s.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE, 0);
      ctx.lineTo(x * TILE, H);
      ctx.stroke();
    }
    for (let y = 0; y <= s.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE);
      ctx.lineTo(W, y * TILE);
      ctx.stroke();
    }

    // Platforms
    for (const plat of s.platforms) {
      ctx.fillStyle = "#4a4a6a";
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = "#6a6a9a";
      ctx.fillRect(plat.x, plat.y, plat.w, 3);
    }

    // Barriers
    for (const barrier of s.barriers) {
      if (barrier.unlocked) continue;
      const color = COLORS[barrier.color] || "#888";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(barrier.x, barrier.y, barrier.w, barrier.h);
      ctx.globalAlpha = 1;
      if (settings?.highContrast) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          barrier.x + 2,
          barrier.y + 2,
          barrier.w - 4,
          barrier.h - 4,
        );
      }
    }

    // Keys
    for (const key of s.keys) {
      if (key.collected) continue;
      const color = COLORS[key.color] || "#EF9F27";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(key.x + TILE / 2, key.y + TILE / 2, TILE / 3, 0, Math.PI * 2);
      ctx.fill();
      if (settings?.highContrast) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(key.color[0], key.x + TILE / 2, key.y + TILE / 2 + 5);
      }
    }

    // Hazards
    for (const hazard of s.hazards) {
      if (hazard.hazardType === 'Platform') continue;
      ctx.fillStyle = "#888";
      const cols = Math.floor(hazard.w / TILE);
      for (let i = 0; i < cols; i++) {
        ctx.beginPath();
        ctx.moveTo(hazard.x + i * TILE, hazard.y + hazard.h);
        ctx.lineTo(hazard.x + i * TILE + TILE / 2, hazard.y);
        ctx.lineTo(hazard.x + (i + 1) * TILE, hazard.y + hazard.h);
        ctx.fill();
      }
    }

    // Exit door
    for (const door of s.exitDoors) {
      const allCollected = s.keys.every((k) => k.collected);
      ctx.fillStyle = allCollected ? "#1D9E75" : "#444";
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.fillStyle = allCollected ? "#9FE1CB" : "#666";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("EXIT", door.x + door.w / 2, door.y + door.h / 2 + 4);
    }

    // Player
    ctx.fillStyle = "#378ADD";
    ctx.beginPath();
    ctx.roundRect(s.player.x, s.player.y, s.player.w, s.player.h, 4);
    ctx.fill();
    // Player eyes
    ctx.fillStyle = "#B5D4F4";
    ctx.fillRect(s.player.x + 5, s.player.y + 7, 8, 6);
    ctx.fillRect(s.player.x + 16, s.player.y + 7, 8, 6);

    // Level complete overlay
    if (s.levelComplete) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Level Complete!", W / 2, H / 2 - 20);
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#9FE1CB";
      ctx.fillText(`Time: ${formatTime(s.elapsedSeconds)}`, W / 2, H / 2 + 20);
    }
  };

  const rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Handle level complete
  useEffect(() => {
    if (!stateRef.current?.levelComplete || completed) return;
    setCompleted(true);
    const elapsed = stateRef.current.elapsedSeconds;
    if (player) {
      api
        .post("/Scores", { levelId: level.id, completionTimeSeconds: elapsed })
        .catch((err) => console.error("Failed to submit score", err));
    }
    setTimeout(() => onComplete(elapsed), 2500);
  });

  const canvasW = (levelData?.columns || 16) * TILE;
  const canvasH = (levelData?.rows || 12) * TILE;

  if (loading) {
    return (
      <div style={styles.loading}>
        <p style={styles.loadingText}>Loading level...</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.gameArea}>
        {/* HUD */}
        <div style={styles.hud}>
          <span style={styles.hudItem}>{level.name}</span>
          {settings?.showTimer && (
            <span style={styles.hudItem}>⏱ {formatTime(hudData.time)}</span>
          )}
          <span style={styles.hudItem}>
            🗝 {hudData.keysCollected}/{hudData.totalKeys}
          </span>
          <button
            style={styles.pauseBtn}
            onClick={() => {
              pausedRef.current = !pausedRef.current;
              setPaused((p) => !p);
            }}
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
        </div>

        {/* Canvas */}
        <div style={{ position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            style={styles.canvas}
          />

          {/* Pause overlay */}
          {paused && (
            <div style={styles.pauseOverlay}>
              <div style={styles.pauseMenu}>
                <h2 style={styles.pauseTitle}>Paused</h2>
                <button
                  style={styles.pauseMenuItem}
                  onClick={() => {
                    pausedRef.current = false;
                    setPaused(false);
                  }}
                >
                  Resume
                </button>
                <button
                  style={styles.pauseMenuItem}
                  onClick={() => {
                    loadLevel();
                    pausedRef.current = false;
                    setPaused(false);
                    setCompleted(false);
                  }}
                >
                  Restart
                </button>
                <button style={styles.pauseMenuItem} onClick={() => onMenu()}>
                  Main Menu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls reminder */}
        {settings?.showControls && (
          <div style={styles.controls}>
            <span>← → Move</span>
            <span>Space / ↑ Jump</span>
            <span>Esc Pause</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "1rem",
    minHeight: "100vh",
  },
  gameArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  loadingText: { color: "#fff", fontSize: "18px" },
  hud: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    background: "rgba(0,0,0,0.5)",
    padding: "8px 16px",
    borderRadius: "8px",
    width: "100%",
    justifyContent: "space-between",
  },
  hudItem: { color: "#fff", fontSize: "14px", fontWeight: "500" },
  pauseBtn: {
    padding: "4px 12px",
    background: "transparent",
    color: "#aaa",
    border: "1px solid #555",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  canvas: { display: "block", borderRadius: "4px", border: "1px solid #333" },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  },
  pauseMenu: {
    background: "#2a2a3e",
    border: "1px solid #444",
    borderRadius: "12px",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "200px",
    alignItems: "center",
  },
  pauseTitle: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: "600",
    margin: "0 0 8px",
  },
  pauseMenuItem: {
    width: "100%",
    padding: "10px",
    background: "transparent",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  controls: { display: "flex", gap: "20px", color: "#666", fontSize: "12px" },
};

export default GameCanvas;
