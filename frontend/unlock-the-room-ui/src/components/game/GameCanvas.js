import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../services/api";
import {
  BARRIER_COLORS,
  BARRIER_BRIGHT_COLORS,
  PLATFORM_COLORS,
  KILLBRICK_BG,
  EXIT_COLORS,
  SPIKE_COLORS,
  PLAYER_FALLBACK,
  HIGH_CONTRAST_BORDER,
  HIGH_CONTRAST_WHITE,
  GAME_BG_FALLBACK,
} from "../../gameColors";

// Read once at module load — no per-frame matchMedia calls
const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Convert a 6-digit hex color to an rgba() string
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const TILE = 40;
const GRAVITY = 0.4;
const JUMP_FORCE = -12;
const MOVE_SPEED = 3;

// Module-level loop controller — only one loop can ever run across all mounts
let activeLoopId = null;

function stopLoop() {
  if (activeLoopId !== null) {
    cancelAnimationFrame(activeLoopId);
    activeLoopId = null;
  }
}

// Sprite sheet: 768x384, 128x160 per frame — defined once at module scope
const SPRITE_FRAMES = {
  idle: [
    [0, 0, 128, 160],
    [128, 0, 128, 160],
    [256, 0, 128, 160],
    [384, 0, 128, 160],
  ],
  walk: [
    [0, 160, 128, 160],
    [128, 160, 128, 160],
    [256, 160, 128, 160],
    [384, 160, 128, 160],
    [512, 160, 128, 160],
    [640, 160, 128, 160],
  ],
  jump: [
    [0, 320, 128, 160],
    [128, 320, 128, 160],
    [256, 320, 128, 160],
  ],
};

function GameCanvas({
  level,
  player,
  settings,
  onComplete,
  onMenu,
  onLevelSelect,
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
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
  const [completionTime, setCompletionTime] = useState(null);
  const [prevBestSeconds, setPrevBestSeconds] = useState(null);
  const pausedRef = useRef(false);

  const loadLevel = useCallback(async () => {
    stopLoop();
    setCompletionTime(null);
    setCompleted(false);
    setLoading(true);
    try {
      const res = await api.get(`/Levels/${level.id}/detail`);
      const data = res.data;
      setLevelData(data);

      const gameObjects = data.gameObjects || [];
      const aiPlatforms = gameObjects
        .filter(
          (o) =>
            o.objectType === "Platform" ||
            (o.objectType === "Hazard" && o.hazardType === "Platform"),
        )
        .map((o) => ({
          x: o.positionX * TILE,
          y: o.positionY * TILE,
          w: o.width * TILE,
          h: o.height * TILE,
        }));
      const platforms = [
        ...buildPlatforms(data.rows, data.columns),
        ...aiPlatforms,
      ];
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
        .map((o) => {
          if (o.hazardType === "KillBrick") {
            const rot = o.rotation || 0;
            let x = o.positionX * TILE,
              y,
              w,
              h;
            if (rot === 180) {
              // top half
              y = o.positionY * TILE;
              w = o.width * TILE;
              h = TILE / 2;
            } else if (rot === 90) {
              // right half
              x = o.positionX * TILE + TILE / 2;
              y = o.positionY * TILE;
              w = TILE / 2;
              h = o.height * TILE;
            } else if (rot === 270) {
              // left half
              y = o.positionY * TILE;
              w = TILE / 2;
              h = o.height * TILE;
            } else {
              // 0° = bottom half (default)
              y = o.positionY * TILE + TILE / 2;
              w = o.width * TILE;
              h = TILE / 2;
            }
            return { ...o, x, y, w, h, rotation: rot };
          }
          return {
            ...o,
            x: o.positionX * TILE,
            y: o.positionY * TILE,
            w: o.width * TILE,
            h: o.height * TILE,
            rotation: o.rotation || 0,
          };
        });
      const exitDoors = gameObjects
        .filter((o) => o.objectType === "ExitDoor")
        .map((o) => ({
          ...o,
          x: o.positionX * TILE,
          y: o.positionY * TILE,
          w: o.width * TILE,
          h: o.height * TILE,
        }));

      const spawnPoint = gameObjects.find((o) => o.objectType === "SpawnPoint");
      const spawnX = spawnPoint ? spawnPoint.positionX * TILE : TILE;
      const spawnY = spawnPoint
        ? spawnPoint.positionY * TILE
        : (data.rows - 3) * TILE;

      stateRef.current = {
        player: {
          x: spawnX,
          y: spawnY,
          w: 28,
          h: 36,
          vx: 0,
          vy: 0,
          onGround: false,
          facing: 1,
          coyoteTime: 0,
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
        lastHudUpdate: -1,
        lastCollectedKeys: -1,
        collectedKeys: 0,
        levelCompleteFired: false,
        particles: [],
        exitParticlesSpawned: false,
      };
      setHudData({
        time: 0,
        keysCollected: 0,
        totalKeys: keys.length,
        keyStates: keys.map((k) => ({ color: k.color, collected: false })),
      });

      // Fix 6 — cache platform adjacency sets (platforms never move)
      stateRef.current.platBottomEdges = new Set(
        platforms.map((p) => `${p.x},${p.y + p.h}`),
      );
      stateRef.current.platTopEdges = new Set(
        platforms.map((p) => `${p.x},${p.y}`),
      );

      // Fix 7 — cache barrier adjacency sets and allSolids; rebuild only when barrier state changes
      const rebuildBarrierEdges = (barriers) => {
        const locked = barriers.filter((b) => !b.unlocked);
        stateRef.current.barrierBottomEdges = new Set(
          locked.map((b) => `${b.color},${b.x},${b.y + b.h}`),
        );
        stateRef.current.barrierTopEdges = new Set(
          locked.map((b) => `${b.color},${b.x},${b.y}`),
        );
        stateRef.current.allSolids = [...stateRef.current.platforms, ...locked];
      };
      stateRef.current.rebuildBarrierEdges = rebuildBarrierEdges;
      rebuildBarrierEdges(barriers);

      // Fix 8 — pre-scale background into an offscreen canvas at exact game resolution
      stateRef.current.bgImage = null;
      const bgImg = new Image();
      bgImg.onload = () => {
        const offscreen = document.createElement("canvas");
        offscreen.width = data.columns * TILE;
        offscreen.height = data.rows * TILE;
        const offCtx = offscreen.getContext("2d");
        offCtx.drawImage(bgImg, 0, 0, offscreen.width, offscreen.height);
        stateRef.current.bgImage = offscreen;
      };
      bgImg.src = "/assets/utr-bg.png";

      stateRef.current.spriteFrames = null;
      const spriteImg = new Image();
      spriteImg.onload = () => {
        const frames = {};
        Object.entries(SPRITE_FRAMES).forEach(([state, frameList]) => {
          frames[state] = frameList.map(([srcX, srcY, srcW, srcH]) => {
            const drawW = Math.round(TILE * 1.2);
            const drawH = Math.round(drawW * (160 / 128));
            const off = document.createElement("canvas");
            off.width = drawW;
            off.height = drawH;
            const offCtx = off.getContext("2d");
            offCtx.drawImage(
              spriteImg,
              srcX,
              srcY,
              srcW,
              srcH,
              0,
              0,
              drawW,
              drawH,
            );
            return off;
          });
        });
        stateRef.current.spriteFrames = frames;
      };
      spriteImg.src = "/assets/squid-sprite.png";

      stateRef.current.animFrame = 0;
      stateRef.current.animTick = 0;
      stateRef.current.lastAnim = "idle";

      setLoading(false);
    } catch (err) {
      console.error("Failed to load level", err);
      setLoading(false);
    }
  }, [level.id]);

  const buildPlatforms = (rows, cols) => {
    return [
      // Ground
      { x: 0, y: (rows - 1) * TILE, w: cols * TILE, h: TILE },
      // Left wall
      { x: 0, y: 0, w: TILE, h: rows * TILE },
      // Right wall
      { x: (cols - 1) * TILE, y: 0, w: TILE, h: rows * TILE },
    ];
  };

  useEffect(() => {
    loadLevel();
  }, [loadLevel]);

  // Fetch player's previous best for this level before they complete it
  useEffect(() => {
    if (!player) {
      setPrevBestSeconds(null);
      return;
    }
    api.get("/Scores/mine")
      .then((res) => {
        const mine = res.data.filter((s) => s.levelId === level.id);
        if (mine.length > 0) {
          const best = mine.reduce((a, b) =>
            a.completionTimeSeconds < b.completionTimeSeconds ? a : b
          );
          setPrevBestSeconds(best.completionTimeSeconds);
        } else {
          setPrevBestSeconds(null);
        }
      })
      .catch(() => setPrevBestSeconds(null));
  }, [player, level.id]);

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
    const ctx = canvas.getContext("2d", { alpha: false });

    // Stop any existing loop globally before starting a new one
    stopLoop();

    const loop = () => {
      if (pausedRef.current) {
        activeLoopId = requestAnimationFrame(loop);
        return;
      }

      const sp = stateRef.current.player;
      const isMovingNow = sp.vx !== 0;
      const isJumpingNow = !sp.onGround;
      const currentAnim = isJumpingNow ? "jump" : isMovingNow ? "walk" : "idle";

      if (stateRef.current.lastAnim !== currentAnim) {
        stateRef.current.lastAnim = currentAnim;
        stateRef.current.animFrame = 0;
        stateRef.current.animTick = 0;
      } else {
        stateRef.current.animTick = (stateRef.current.animTick + 1) % 8;
        if (stateRef.current.animTick === 0) {
          const frameCount =
            currentAnim === "idle" ? 4 : currentAnim === "walk" ? 6 : 3;
          stateRef.current.animFrame =
            (stateRef.current.animFrame + 1) % frameCount;
        }
      }

      update(stateRef.current, keysRef.current);
      draw(ctx, stateRef.current, settings);

      const s = stateRef.current;
      const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
      s.elapsedSeconds = elapsed;

      const collectedChanged = s.collectedKeys !== s.lastCollectedKeys;
      if (elapsed !== s.lastHudUpdate || collectedChanged) {
        s.lastHudUpdate = elapsed;
        s.lastCollectedKeys = s.collectedKeys;
        setHudData({
          time: elapsed,
          keysCollected: s.collectedKeys,
          totalKeys: s.keys.length,
          keyStates: s.keys.map((k) => ({ color: k.color, collected: k.collected })),
        });
      }

      if (s.levelComplete && !s.levelCompleteFired) {
        s.levelCompleteFired = true;
        setCompletionTime(s.elapsedSeconds);
        if (player) {
          api
            .post("/Scores", {
              levelId: level.id,
              completionTimeSeconds: s.elapsedSeconds,
            })
            .catch((err) => console.error("Failed to submit score", err));
        }
      }

      activeLoopId = requestAnimationFrame(loop);
    };

    activeLoopId = requestAnimationFrame(loop);

    return () => {
      stopLoop();
    };
  }, [loading, settings]);

  const update = (s, keys) => {
    const p = s.player;

    // Movement
    p.vx = 0;
    if (keys["ArrowLeft"] || keys["KeyA"]) {
      p.vx = -MOVE_SPEED;
      p.facing = -1;
    }
    if (keys["ArrowRight"] || keys["KeyD"]) {
      p.vx = MOVE_SPEED;
      p.facing = 1;
    }
    if (p.onGround) {
      p.coyoteTime = 8;
    } else if (p.coyoteTime > 0) {
      p.coyoteTime--;
    }

    if (
      (keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) &&
      p.coyoteTime > 0
    ) {
      p.vy = JUMP_FORCE;
      p.coyoteTime = 0;
    }

    // Gravity
    p.vy += GRAVITY;

    // Platform collision
    p.onGround = false;
    const allSolids = s.allSolids;

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
        s.collectedKeys = (s.collectedKeys || 0) + 1;
        for (const barrier of s.barriers) {
          if (barrier.color === key.color) barrier.unlocked = true;
        }
        s.rebuildBarrierEdges(s.barriers);
        if (!reducedMotion) {
          spawnParticles(
            s,
            key.x + TILE / 2,
            key.y + TILE / 2,
            BARRIER_COLORS[key.color] || BARRIER_COLORS.Yellow,
            12,
          );
        }
      }
    }

    // Hazard collision — respawn
    for (const hazard of s.hazards) {
      if (hazard.hazardType === "Platform") continue;
      if (rectsOverlap(p, hazard)) {
        p.x = s.spawnX;
        p.y = s.spawnY;
        p.vx = 0;
        p.vy = 0;
        for (const key of s.keys) key.collected = false;
        s.collectedKeys = 0;
        for (const barrier of s.barriers) barrier.unlocked = false;
        s.rebuildBarrierEdges(s.barriers);
      }
    }

    // Exit door
    const allKeysCollected = s.keys.every((k) => k.collected);
    for (const door of s.exitDoors) {
      if (allKeysCollected && rectsOverlap(p, door)) {
        s.levelComplete = true;
        if (!reducedMotion && !s.exitParticlesSpawned) {
          s.exitParticlesSpawned = true;
          spawnParticles(
            s,
            door.x + door.w / 2,
            door.y + door.h / 2,
            "#ffffff",
            12,
          );
        }
      }
    }

    // Particle tick — velocity, gravity, fade, FIFO eviction keeps pool ≤ 100
    if (s.particles.length > 0) {
      for (const pt of s.particles) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.08;
        pt.life -= 1 / 36; // ~600 ms at 60 fps
      }
      s.particles = s.particles.filter((pt) => pt.life > 0);
    }
  };

  // FIFO eviction: if adding `count` particles would exceed 100, drop the oldest.
  const spawnParticles = (s, cx, cy, color, count) => {
    const MAX_PARTICLES = 100;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      const pt = {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1.0,
        color,
      };
      if (s.particles.length >= MAX_PARTICLES) {
        s.particles.shift(); // evict oldest
      }
      s.particles.push(pt);
    }
  };

  const draw = (ctx, s, settings) => {
    const W = s.cols * TILE;
    const H = s.rows * TILE;
    ctx.clearRect(0, 0, W, H);

    // Background image (offscreen canvas, pre-scaled at load time)
    if (s.bgImage) {
      ctx.drawImage(s.bgImage, 0, 0);
    } else {
      ctx.fillStyle = GAME_BG_FALLBACK;
      ctx.fillRect(0, 0, W, H);
    }

    // Platforms (adjacency sets cached at load time in s.platBottomEdges / s.platTopEdges)
    for (const plat of s.platforms) {
      const px = Math.round(plat.x),
        py = Math.round(plat.y);
      const pw = Math.round(plat.w),
        ph = Math.round(plat.h);
      const hasAbove = s.platBottomEdges.has(`${plat.x},${plat.y}`);
      const hasBelow = s.platTopEdges.has(`${plat.x},${plat.y + plat.h}`);
      // Body
      ctx.fillStyle = PLATFORM_COLORS.body;
      ctx.fillRect(px, py, pw, ph);
      // Top highlight — skip when a platform is directly above (would create seam)
      if (!hasAbove) {
        ctx.fillStyle = PLATFORM_COLORS.topHighlight;
        ctx.fillRect(px, py, pw, 3);
      }
      // Inner surface: base is ph-4 starting at y+3; adjust for neighbors
      const innerTopY = hasAbove ? py : py + 3;
      const innerH = ph - 4 + (hasAbove ? 3 : 0) + (hasBelow ? 2 : 0);
      ctx.fillStyle = PLATFORM_COLORS.inner;
      ctx.fillRect(px, innerTopY, pw, innerH);
      // Bottom shadow strip — skip when a platform is directly below
      if (!hasBelow) {
        ctx.fillStyle = PLATFORM_COLORS.bottomShadow;
        ctx.fillRect(px, py + ph - 2, pw, 2);
      }
    }

    // Barriers — animated energy field
    const stripeSpacing = 18;
    // Scrolling offset advances ~1px per frame at 60fps; frozen when reduced motion
    const stripeOffset = reducedMotion ? 0 : (Date.now() / 60) % stripeSpacing;
    for (const barrier of s.barriers) {
      if (barrier.unlocked) continue;
      const color = BARRIER_COLORS[barrier.color] || BARRIER_COLORS.White;
      const bright = BARRIER_BRIGHT_COLORS[barrier.color] || BARRIER_BRIGHT_COLORS.White;
      const bx = Math.round(barrier.x),
        by = Math.round(barrier.y);
      const bw = Math.round(barrier.w),
        bh = Math.round(barrier.h);
      const hasAbove = s.barrierBottomEdges.has(
        `${barrier.color},${barrier.x},${barrier.y}`,
      );
      const hasBelow = s.barrierTopEdges.has(
        `${barrier.color},${barrier.x},${barrier.y + barrier.h}`,
      );

      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, bw, bh);
      ctx.clip();

      // Vertical gradient fill — brighter at edges, slightly dimmer in middle
      const bgGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
      bgGrad.addColorStop(0,   hexToRgba(color, 0.72));
      bgGrad.addColorStop(0.45, hexToRgba(color, 0.48));
      bgGrad.addColorStop(1,   hexToRgba(color, 0.68));
      ctx.fillStyle = bgGrad;
      ctx.fillRect(bx, by, bw, bh);

      // Diagonal scrolling stripes (45°) — clipped to barrier bounds
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = bright;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let sx = bx - bh + stripeOffset; sx < bx + bw + stripeSpacing; sx += stripeSpacing) {
        ctx.moveTo(sx, by + bh);
        ctx.lineTo(sx + bh, by);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.restore(); // remove clip

      // Side border lines (left + right always; top/bottom only at open edges)
      ctx.strokeStyle = hexToRgba(color, 0.7);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + 1, by);
      ctx.lineTo(bx + 1, by + bh);
      ctx.moveTo(bx + bw - 1, by);
      ctx.lineTo(bx + bw - 1, by + bh);
      ctx.stroke();

      // Bright cap lines with glow at open edges
      if (!hasAbove) {
        ctx.save();
        ctx.shadowColor = bright;
        ctx.shadowBlur = 8;
        ctx.fillStyle = bright;
        ctx.fillRect(bx, by, bw, 2);
        ctx.restore();
      }
      if (!hasBelow) {
        ctx.save();
        ctx.shadowColor = bright;
        ctx.shadowBlur = 8;
        ctx.fillStyle = bright;
        ctx.fillRect(bx, by + bh - 2, bw, 2);
        ctx.restore();
      }

      if (settings?.highContrast) {
        ctx.strokeStyle = HIGH_CONTRAST_WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
      }
    }

    // Keys
    for (const key of s.keys) {
      if (key.collected) continue;
      const color = BARRIER_COLORS[key.color] || BARRIER_COLORS.Yellow;
      const cx = Math.round(key.x + TILE / 2);
      const cy = Math.round(key.y + TILE / 2);
      const r = Math.round(TILE / 3);
      const rShine = Math.round(r * 0.35);
      const shineCx = Math.round(cx - r * 0.3);
      const shineCy = Math.round(cy - r * 0.3);
      // Drop shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 2, r, 0, Math.PI * 2);
      ctx.fill();
      // Key body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // Outer ring
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      // Shine highlight
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(shineCx, shineCy, rShine, 0, Math.PI * 2);
      ctx.fill();
      if (settings?.highContrast) {
        ctx.strokeStyle = HIGH_CONTRAST_WHITE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = HIGH_CONTRAST_WHITE;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(key.color[0], cx, cy + 5);
      }
    }

    // Hazards (spikes + kill bricks)
    for (const hazard of s.hazards) {
      if (hazard.hazardType === "Platform") continue;

      if (hazard.hazardType === "KillBrick") {
        const hx = Math.round(hazard.x),
          hy = Math.round(hazard.y);
        const hw = Math.round(hazard.w),
          hh = Math.round(hazard.h);
        const isVertical = hazard.rotation === 90 || hazard.rotation === 270;
        ctx.fillStyle = KILLBRICK_BG;
        ctx.fillRect(hx, hy, hw, hh);
        // Gradient runs across the thin dimension of the strip
        const laserGrad = isVertical
          ? ctx.createLinearGradient(hx, hy, hx + hw, hy)
          : ctx.createLinearGradient(hx, hy, hx, hy + hh);
        laserGrad.addColorStop(0, "rgba(160, 0, 0, 0.95)");
        laserGrad.addColorStop(0.3, "rgba(240, 20, 20, 1.0)");
        laserGrad.addColorStop(0.5, "rgba(255, 60, 60, 1.0)");
        laserGrad.addColorStop(0.7, "rgba(240, 20, 20, 1.0)");
        laserGrad.addColorStop(1, "rgba(160, 0, 0, 0.95)");
        ctx.fillStyle = laserGrad;
        ctx.fillRect(hx, hy, hw, hh);
        // Bright core strip runs along the long dimension
        if (isVertical) {
          const coreW = Math.max(2, Math.floor(hw * 0.22));
          const coreX = hx + Math.floor((hw - coreW) / 2);
          ctx.fillStyle = "rgba(255, 210, 210, 0.88)";
          ctx.fillRect(coreX, hy + 3, coreW, hh - 6);
          ctx.fillStyle = "rgba(255, 80, 80, 0.55)";
          ctx.fillRect(hx, hy, 1, hh);
        } else {
          const coreH = Math.max(2, Math.floor(hh * 0.22));
          const coreY = hy + Math.floor((hh - coreH) / 2);
          ctx.fillStyle = "rgba(255, 210, 210, 0.88)";
          ctx.fillRect(hx + 3, coreY, hw - 6, coreH);
          ctx.fillStyle = "rgba(255, 80, 80, 0.55)";
          ctx.fillRect(hx, hy, hw, 1);
        }
        if (settings?.highContrast) {
          ctx.strokeStyle = HIGH_CONTRAST_BORDER;
          ctx.lineWidth = 2;
          ctx.strokeRect(hx, hy, hw, hh);
        }
        continue;
      }

      const spikeCols = Math.floor(hazard.w / TILE);
      for (let i = 0; i < spikeCols; i++) {
        const sx = hazard.x + i * TILE;
        const cx = Math.round(sx + TILE / 2);
        const cy = Math.round(hazard.y + hazard.h / 2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((hazard.rotation * Math.PI) / 180);

        // Spike body path
        ctx.beginPath();
        ctx.moveTo(-TILE / 2 + 2, TILE / 2);
        ctx.lineTo(0, -TILE / 2 + 2);
        ctx.lineTo(TILE / 2 - 2, TILE / 2);
        ctx.closePath();

        // Metallic gradient: dark base → lighter near tip
        const spikeGrad = ctx.createLinearGradient(0, TILE / 2, 0, -TILE / 2 + 2);
        spikeGrad.addColorStop(0,    "#444455");
        spikeGrad.addColorStop(0.55, SPIKE_COLORS.body);
        spikeGrad.addColorStop(1,    SPIKE_COLORS.edge);
        ctx.fillStyle = spikeGrad;
        ctx.fill();

        // Left-face highlight simulating a light source from the upper-left
        ctx.strokeStyle = SPIKE_COLORS.edge;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-TILE / 2 + 2, TILE / 2);
        ctx.lineTo(0, -TILE / 2 + 2);
        ctx.stroke();

        ctx.restore();
      }
      if (settings?.highContrast) {
        ctx.strokeStyle = HIGH_CONTRAST_BORDER;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          Math.round(hazard.x),
          Math.round(hazard.y),
          Math.round(hazard.w),
          Math.round(hazard.h),
        );
      }
    }

    // Exit door
    for (const door of s.exitDoors) {
      const allCollected = s.collectedKeys === s.keys.length;
      const dx = Math.round(door.x),
        dy = Math.round(door.y);
      const dw = Math.round(door.w),
        dh = Math.round(door.h);
      ctx.fillStyle = allCollected ? EXIT_COLORS.activeBg : EXIT_COLORS.inactiveBg;
      ctx.fillRect(dx, dy, dw, dh);
      // Door border
      ctx.strokeStyle = allCollected ? EXIT_COLORS.activeBorder : EXIT_COLORS.inactiveBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(dx + 1, dy + 1, dw - 2, dh - 2);
      // Door detail (arch suggestion)
      ctx.strokeStyle = allCollected ? EXIT_COLORS.activeInner : EXIT_COLORS.inactiveInner;
      ctx.lineWidth = 1;
      ctx.strokeRect(dx + 4, dy + 4, dw - 8, dh - 4);
      // Label
      ctx.fillStyle = allCollected ? EXIT_COLORS.activeLabel : EXIT_COLORS.inactiveLabel;
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("EXIT", dx + dw / 2, dy + dh / 2 + 4);
    }

    // Particles (drawn beneath the player so they feel embedded in the world)
    if (s.particles.length > 0) {
      for (const pt of s.particles) {
        const radius = Math.max(1, Math.round(pt.life * 4));
        ctx.save();
        ctx.globalAlpha = pt.life * 0.85;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(Math.round(pt.x), Math.round(pt.y), radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Player sprite (pre-rendered offscreen canvases — no per-frame alpha compositing)
    const p2 = s.player;
    if (s.spriteFrames) {
      const animState = s.lastAnim || "idle";
      const frameMap = s.spriteFrames[animState];
      if (frameMap) {
        const currentFrame = s.animFrame % frameMap.length;
        const offscreen = frameMap[currentFrame];

        const drawW = offscreen.width;
        const drawH = offscreen.height;
        const drawX = Math.round(p2.x + p2.w / 2 - drawW / 2);
        const yOffset =
          animState === "idle" ? 10 : animState === "jump" ? 6 : 18;
        const drawY = Math.round(p2.y + p2.h - drawH + yOffset);

        ctx.save();
        if (p2.facing < 0) {
          ctx.translate(Math.round(p2.x + p2.w / 2), 0);
          ctx.scale(-1, 1);
          ctx.translate(-Math.round(p2.x + p2.w / 2), 0);
        }
        ctx.drawImage(offscreen, drawX, drawY);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = PLAYER_FALLBACK;
      ctx.fillRect(Math.round(p2.x), Math.round(p2.y), p2.w, p2.h);
    }
  };

  const rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const canvasW = (levelData?.columns || 16) * TILE;
  const canvasH = (levelData?.rows || 12) * TILE;

  if (loading) {
    return (
      <div style={styles.loading}>
        <p style={styles.loadingText}>Loading level...</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{level.name}</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.gameArea}>
        {/* HUD */}
        <div style={styles.hud}>
          <div style={styles.hudLeft}>
            <span style={styles.hudLevelName}>{level.name}</span>
            {settings?.showTimer && (
              <span style={styles.hudTimer}>{formatTime(hudData.time)}</span>
            )}
            {hudData.totalKeys > 0 && (
              <div style={styles.hudKeys}>
                {(hudData.keyStates || []).map((k, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: k.collected
                        ? "#444466"
                        : (BARRIER_COLORS[k.color] || "#aaa"),
                      opacity: k.collected ? 0.45 : 1,
                      border: k.collected
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(255,255,255,0.25)",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            style={styles.pauseBtn}
            onClick={() => {
              pausedRef.current = !pausedRef.current;
              setPaused((p) => !p);
            }}
          >
            {paused ? "Resume" : "Pause"}
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
                  style={styles.pauseMenuResume}
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
                  Restart Level
                </button>
                <button style={styles.pauseMenuItem} onClick={() => onMenu()}>
                  Main Menu
                </button>
              </div>
            </div>
          )}

          {/* Completion overlay */}
          {completionTime !== null && (
            <div style={styles.pauseOverlay}>
              <div style={styles.pauseMenu}>
                {/* ★ callout: first completion or new best (logged-in players only) */}
                {player && (prevBestSeconds === null || completionTime < prevBestSeconds) && (
                  <p style={styles.newBestCallout}>
                    {prevBestSeconds === null ? "★ First completion!" : "★ New best!"}
                  </p>
                )}
                <p
                  style={{
                    color: "var(--game-accent)",
                    fontSize: "13px",
                    margin: "0 0 4px",
                  }}
                >
                  LEVEL COMPLETE
                </p>
                <h2
                  style={{
                    ...styles.pauseTitle,
                    color: "var(--surface)",
                    fontSize: "28px",
                  }}
                >
                  {formatTime(completionTime)}
                </h2>
                {/* Previous personal best — shown when a prior run exists */}
                {player && prevBestSeconds !== null && (
                  <p style={styles.prevBestLabel}>
                    Best: {formatTime(prevBestSeconds)}
                  </p>
                )}
                <p
                  style={{
                    color: "var(--text-subtle)",
                    fontSize: "12px",
                    margin: "-2px 0 12px",
                  }}
                >
                  completion time
                </p>
                <button
                  style={styles.pauseMenuResume}
                  onClick={() => onComplete(completionTime)}
                >
                  Next level
                </button>
                <button
                  style={styles.pauseMenuItem}
                  onClick={() => {
                    setCompletionTime(null);
                    setCompleted(false);
                    loadLevel();
                  }}
                >
                  Replay level
                </button>
                {player && (
                  <button
                    style={styles.pauseMenuItem}
                    onClick={async () => {
                      try {
                        await api.post(`/SavedLevels/${level.id}`);
                        alert("Level saved!");
                      } catch {
                        alert("Already saved or error saving.");
                      }
                    }}
                  >
                    Save level
                  </button>
                )}
                <button
                  style={styles.pauseMenuItem}
                  onClick={() => onLevelSelect()}
                >
                  Change level
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls reminder — hidden when level complete overlay is showing */}
        {settings?.showControls && completionTime === null && (
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
    paddingTop: "1.5rem",
    minHeight: "100vh",
  },
  gameArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    minHeight: "100vh",
  },
  loadingText: { color: "var(--game-text-dim)", fontSize: "15px", letterSpacing: "0.3px" },
  hud: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    background: "var(--game-hud-bg)",
    borderBottom: "1px solid var(--game-hud-border)",
    padding: "8px 14px",
    borderRadius: "10px 10px 0 0",
    width: "100%",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },
  hudLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  hudLevelName: {
    color: "var(--game-text)",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.2px",
  },
  hudTimer: {
    color: "var(--text-placeholder)",
    fontSize: "13px",
    fontWeight: "500",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.5px",
  },
  hudKeys: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "5px 9px",
  },
  pauseBtn: {
    padding: "5px 13px",
    background: "var(--game-btn-bg)",
    color: "var(--game-text-dim)",
    border: "1px solid var(--game-panel-border)",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    letterSpacing: "0.2px",
  },
  canvas: {
    display: "block",
    borderRadius: "0 0 10px 10px",
    border: "1px solid var(--game-hud-border)",
    borderTop: "none",
  },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.78)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0 0 10px 10px",
  },
  pauseMenu: {
    background: "var(--game-panel-bg)",
    border: "1px solid var(--game-panel-border)",
    borderRadius: "14px",
    padding: "2rem 2rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "220px",
    alignItems: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  pauseTitle: {
    color: "var(--game-text-bright)",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 6px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  pauseMenuResume: {
    width: "100%",
    padding: "11px",
    background: "var(--color-primary)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  pauseMenuItem: {
    width: "100%",
    padding: "10px",
    background: "var(--game-btn-item-bg)",
    color: "var(--game-text-dim)",
    border: "1px solid var(--game-panel-border)",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  controls: {
    display: "flex",
    gap: "20px",
    color: "var(--text-secondary)",
    fontSize: "11px",
    marginTop: "8px",
    letterSpacing: "0.2px",
  },
  newBestCallout: {
    color: "var(--color-warning)",
    fontSize: "14px",
    fontWeight: "700",
    margin: "0 0 8px",
    letterSpacing: "0.3px",
    animation: "newBestBounce 0.5s ease-out",
  },
  prevBestLabel: {
    color: "var(--text-subtle)",
    fontSize: "11px",
    margin: "-4px 0 4px",
    fontVariantNumeric: "tabular-nums",
  },
};

export default GameCanvas;
