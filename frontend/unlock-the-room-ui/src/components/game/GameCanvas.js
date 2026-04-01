import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../services/api";

const TILE = 40;
const GRAVITY = 0.4;
const JUMP_FORCE = -12;
const MOVE_SPEED = 3;
const COLORS = {
  Red: "#E24B4A",
  Blue: "#378ADD",
  Green: "#639922",
  Yellow: "#EF9F27",
  Purple: "#7F77DD",
  White: "#E8E8E8",
};

function GameCanvas({ level, player, settings, onComplete, onMenu, onLevelSelect }) {
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
  const [completionTime, setCompletionTime] = useState(null);
  const pausedRef = useRef(false);

  const loadLevel = useCallback(async () => {
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
            let x = o.positionX * TILE, y, w, h;
            if (rot === 180) {        // top half
              y = o.positionY * TILE; w = o.width * TILE; h = TILE / 2;
            } else if (rot === 90) {  // right half
              x = o.positionX * TILE + TILE / 2;
              y = o.positionY * TILE; w = TILE / 2; h = o.height * TILE;
            } else if (rot === 270) { // left half
              y = o.positionY * TILE; w = TILE / 2; h = o.height * TILE;
            } else {                  // 0° = bottom half (default)
              y = o.positionY * TILE + TILE / 2; w = o.width * TILE; h = TILE / 2;
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
        collectedKeys: 0,
        levelCompleteFired: false,
      };
      setHudData({ time: 0, keysCollected: 0, totalKeys: keys.length });

      // Fix 6 — cache platform adjacency sets (platforms never move)
      stateRef.current.platBottomEdges = new Set(
        platforms.map((p) => `${p.x},${p.y + p.h}`)
      );
      stateRef.current.platTopEdges = new Set(
        platforms.map((p) => `${p.x},${p.y}`)
      );

      // Fix 7 — cache barrier adjacency sets; rebuild whenever barrier state changes
      const rebuildBarrierEdges = (barriers) => {
        stateRef.current.barrierBottomEdges = new Set(
          barriers.filter((b) => !b.unlocked).map((b) => `${b.color},${b.x},${b.y + b.h}`)
        );
        stateRef.current.barrierTopEdges = new Set(
          barriers.filter((b) => !b.unlocked).map((b) => `${b.color},${b.x},${b.y}`)
        );
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

      const spriteImg = new Image();
      spriteImg.src = "/assets/squid-sprite.png";
      stateRef.current.spriteImage = spriteImg;

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

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (pausedRef.current) return;
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

      if (stateRef.current.levelComplete && !stateRef.current.levelCompleteFired) {
        stateRef.current.levelCompleteFired = true;
        setCompleted(true);
        const elapsed = stateRef.current.elapsedSeconds;
        setCompletionTime(elapsed);
        if (player) {
          api.post('/Scores', { levelId: level.id, completionTimeSeconds: elapsed })
            .catch(err => console.error('Failed to submit score', err));
        }
      }

      const s = stateRef.current;
      const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
      s.elapsedSeconds = elapsed;

      if (elapsed !== s.lastHudUpdate) {
        s.lastHudUpdate = elapsed;
        setHudData({
          time: elapsed,
          keysCollected: s.collectedKeys,
          totalKeys: s.keys.length,
        });
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
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
        s.collectedKeys = (s.collectedKeys || 0) + 1;
        for (const barrier of s.barriers) {
          if (barrier.color === key.color) barrier.unlocked = true;
        }
        s.rebuildBarrierEdges(s.barriers);
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
      }
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
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, W, H);
    }

    // Platforms (adjacency sets cached at load time in s.platBottomEdges / s.platTopEdges)
    for (const plat of s.platforms) {
      const hasAbove = s.platBottomEdges.has(`${plat.x},${plat.y}`);
      const hasBelow = s.platTopEdges.has(`${plat.x},${plat.y + plat.h}`);
      // Body
      ctx.fillStyle = "#3d3d5c";
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      // Top highlight — skip when a platform is directly above (would create seam)
      if (!hasAbove) {
        ctx.fillStyle = "#6060a0";
        ctx.fillRect(plat.x, plat.y, plat.w, 3);
      }
      // Inner surface: base is plat.h-4 starting at y+3; adjust for neighbors
      // +3 top adjust when hasAbove (start from y, not y+3), +2 bottom adjust when hasBelow (cover shadow area)
      const innerTopY = hasAbove ? plat.y : plat.y + 3;
      const innerH = plat.h - 4 + (hasAbove ? 3 : 0) + (hasBelow ? 2 : 0);
      ctx.fillStyle = "#48486e";
      ctx.fillRect(plat.x, innerTopY, plat.w, innerH);
      // Bottom shadow strip — skip when a platform is directly below
      if (!hasBelow) {
        ctx.fillStyle = "#2a2a42";
        ctx.fillRect(plat.x, plat.y + plat.h - 2, plat.w, 2);
      }
    }

    // Barriers (adjacency sets rebuilt via s.rebuildBarrierEdges only when state changes)
    for (const barrier of s.barriers) {
      if (barrier.unlocked) continue;
      const color = COLORS[barrier.color] || "#888";
      const hasAbove = s.barrierBottomEdges.has(
        `${barrier.color},${barrier.x},${barrier.y}`,
      );
      const hasBelow = s.barrierTopEdges.has(
        `${barrier.color},${barrier.x},${barrier.y + barrier.h}`,
      );
      // Filled body
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(barrier.x, barrier.y, barrier.w, barrier.h);
      ctx.globalAlpha = 1;
      // Border — draw as individual segments, skipping shared internal edges
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Left edge
      ctx.moveTo(barrier.x + 1, barrier.y + 1);
      ctx.lineTo(barrier.x + 1, barrier.y + barrier.h - 1);
      // Right edge
      ctx.moveTo(barrier.x + barrier.w - 1, barrier.y + 1);
      ctx.lineTo(barrier.x + barrier.w - 1, barrier.y + barrier.h - 1);
      // Top edge — only if no neighbor above
      if (!hasAbove) {
        ctx.moveTo(barrier.x + 1, barrier.y + 1);
        ctx.lineTo(barrier.x + barrier.w - 1, barrier.y + 1);
      }
      // Bottom edge — only if no neighbor below
      if (!hasBelow) {
        ctx.moveTo(barrier.x + 1, barrier.y + barrier.h - 1);
        ctx.lineTo(barrier.x + barrier.w - 1, barrier.y + barrier.h - 1);
      }
      ctx.stroke();
      // Inner pattern lines (vertical stripes)
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      const stripeSpacing = 12;
      for (
        let sx = barrier.x + stripeSpacing;
        sx < barrier.x + barrier.w;
        sx += stripeSpacing
      ) {
        ctx.beginPath();
        ctx.moveTo(sx, barrier.y);
        ctx.lineTo(sx, barrier.y + barrier.h);
        ctx.stroke();
      }
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
      const cx = key.x + TILE / 2;
      const cy = key.y + TILE / 2;
      const r = TILE / 3;
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
      ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      if (settings?.highContrast) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(key.color[0], cx, cy + 5);
      }
    }

    // Hazards (spikes + kill bricks)
    for (const hazard of s.hazards) {
      if (hazard.hazardType === "Platform") continue;

      if (hazard.hazardType === "KillBrick") {
        const hx = hazard.x, hy = hazard.y, hw = hazard.w, hh = hazard.h;
        const isVertical = hazard.rotation === 90 || hazard.rotation === 270;
        ctx.fillStyle = "#2a0000";
        ctx.fillRect(hx, hy, hw, hh);
        // Gradient runs across the thin dimension of the strip
        const laserGrad = isVertical
          ? ctx.createLinearGradient(hx, hy, hx + hw, hy)
          : ctx.createLinearGradient(hx, hy, hx, hy + hh);
        laserGrad.addColorStop(0,   "rgba(160, 0, 0, 0.95)");
        laserGrad.addColorStop(0.3, "rgba(240, 20, 20, 1.0)");
        laserGrad.addColorStop(0.5, "rgba(255, 60, 60, 1.0)");
        laserGrad.addColorStop(0.7, "rgba(240, 20, 20, 1.0)");
        laserGrad.addColorStop(1,   "rgba(160, 0, 0, 0.95)");
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
          ctx.strokeStyle = "#ff0";
          ctx.lineWidth = 2;
          ctx.strokeRect(hx, hy, hw, hh);
        }
        continue;
      }

      const spikeCols = Math.floor(hazard.w / TILE);
      for (let i = 0; i < spikeCols; i++) {
        const sx = hazard.x + i * TILE;
        const cx = sx + TILE / 2;
        const cy = hazard.y + hazard.h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((hazard.rotation * Math.PI) / 180);
        ctx.fillStyle = "#888";
        ctx.beginPath();
        ctx.moveTo(-TILE / 2 + 2,  TILE / 2);
        ctx.lineTo(0,              -TILE / 2 + 2);
        ctx.lineTo( TILE / 2 - 2,  TILE / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-TILE / 2 + 2, TILE / 2);
        ctx.lineTo(0,             -TILE / 2 + 2);
        ctx.stroke();
        ctx.restore();
      }
      if (settings?.highContrast) {
        ctx.strokeStyle = "#ff0";
        ctx.lineWidth = 2;
        ctx.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
      }
    }

    // Exit door
    for (const door of s.exitDoors) {
      const allCollected = s.keys.every((k) => k.collected);
      ctx.fillStyle = allCollected ? "#0d6b4f" : "#252538";
      ctx.fillRect(door.x, door.y, door.w, door.h);
      // Door border
      ctx.strokeStyle = allCollected ? "#1DB988" : "#555";
      ctx.lineWidth = 2;
      ctx.strokeRect(door.x + 1, door.y + 1, door.w - 2, door.h - 2);
      // Door detail (arch suggestion)
      ctx.strokeStyle = allCollected ? "#80F5D2" : "#444";
      ctx.lineWidth = 1;
      ctx.strokeRect(door.x + 4, door.y + 4, door.w - 8, door.h - 4);
      // Label
      ctx.fillStyle = allCollected ? "#80F5D2" : "#666";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("EXIT", door.x + door.w / 2, door.y + door.h / 2 + 4);
    }

    // Player sprite
    const p2 = s.player;
    if (s.spriteImage?.complete && s.spriteImage.naturalWidth > 0) {
      const isMoving = p2.vx !== 0;
      const isJumping = !p2.onGround;

      // Sprite sheet: 768x384, perfect 128x128 grid
      const FRAMES = {
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

      const animState = isJumping ? "jump" : isMoving ? "walk" : "idle";
      const frameMap = FRAMES[animState];
      const currentFrame = s.animFrame % frameMap.length;
      const [srcX, srcY, srcW, srcH] = frameMap[currentFrame];

      const drawW = TILE * 1.2;
      const drawH = drawW * (160 / 128);
      const drawX = p2.x + p2.w / 2 - drawW / 2;

      // Per-animation vertical offset to align feet to ground
      const yOffset = animState === "idle" ? 10 : animState === "jump" ? 6 : 18;
      const drawY = p2.y + p2.h - drawH + yOffset;

      ctx.save();
      if (p2.facing < 0) {
        ctx.translate(p2.x + p2.w / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(p2.x + p2.w / 2), 0);
      }

      ctx.drawImage(
        s.spriteImage,
        srcX,
        srcY,
        srcW,
        srcH,
        drawX,
        drawY,
        drawW,
        drawH,
      );
      ctx.restore();
    } else {
      ctx.fillStyle = "#9898ac";
      ctx.fillRect(p2.x, p2.y, p2.w, p2.h);
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
        <p style={{ color: "#444", fontSize: "12px" }}>{level.name}</p>
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
            <span style={styles.hudKeys}>
              Keys {hudData.keysCollected}/{hudData.totalKeys}
            </span>
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
                <p style={{ color: '#80F5D2', fontSize: '13px', margin: '0 0 4px' }}>
                  LEVEL COMPLETE
                </p>
                <h2 style={{ ...styles.pauseTitle, color: '#fff', fontSize: '28px' }}>
                  {formatTime(completionTime)}
                </h2>
                <p style={{ color: '#888', fontSize: '12px', margin: '-6px 0 12px' }}>
                  completion time
                </p>
                <button style={styles.pauseMenuResume} onClick={() => onComplete(completionTime)}>
                  Next level
                </button>
                <button style={styles.pauseMenuItem} onClick={() => {
                  setCompletionTime(null);
                  setCompleted(false);
                  loadLevel();
                }}>
                  Replay level
                </button>
                {player && (
                  <button style={styles.pauseMenuItem} onClick={async () => {
                    try {
                      await api.post(`/SavedLevels/${level.id}`);
                      alert('Level saved!');
                    } catch {
                      alert('Already saved or error saving.');
                    }
                  }}>
                    Save level
                  </button>
                )}
                <button style={styles.pauseMenuItem} onClick={() => onLevelSelect()}>
                  Change level
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
  loadingText: { color: "#ccc", fontSize: "15px", letterSpacing: "0.3px" },
  hud: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    background: "#111120",
    borderBottom: "1px solid #2a2a48",
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
    color: "#e0e0e0",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.2px",
  },
  hudTimer: {
    color: "#aaa",
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
    padding: "3px 9px",
    color: "#e0e0e0",
    fontSize: "12px",
    fontWeight: "600",
  },
  pauseBtn: {
    padding: "5px 13px",
    background: "#2a2a44",
    color: "#ccc",
    border: "1px solid #3a3a5a",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    letterSpacing: "0.2px",
  },
  canvas: {
    display: "block",
    borderRadius: "0 0 10px 10px",
    border: "1px solid #2a2a48",
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
    background: "#1c1c30",
    border: "1px solid #3a3a5a",
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
    color: "#e8e8e8",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 6px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  pauseMenuResume: {
    width: "100%",
    padding: "11px",
    background: "#534AB7",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  pauseMenuItem: {
    width: "100%",
    padding: "10px",
    background: "#252538",
    color: "#ccc",
    border: "1px solid #3a3a5a",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  controls: {
    display: "flex",
    gap: "20px",
    color: "#444",
    fontSize: "11px",
    marginTop: "8px",
    letterSpacing: "0.2px",
  },
};

export default GameCanvas;
