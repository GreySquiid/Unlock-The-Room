import { useEffect, useRef } from "react";
import { GAME_BG_FALLBACK } from "../../gameColors";

// Mulberry32 seeded PRNG — deterministic, no external dependency
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a ^ (a >>> 15);
    t = Math.imul(t, 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pre-generated at module scope — hardcoded seeds, identical every visit
const MID_BUILDINGS = (() => {
  const r = prng(0xdeadbeef);
  const arr = [];
  let x = 0;
  for (let i = 0; i < 50; i++) {
    const w = 20 + Math.floor(r() * 60);
    const h = 40 + Math.floor(r() * 120);
    arr.push({ x, w, h });
    x += w + 5 + Math.floor(r() * 15);
  }
  return arr;
})();

const NEAR_BUILDINGS = (() => {
  const r = prng(0xcafebabe);
  const arr = [];
  let x = 0;
  for (let i = 0; i < 50; i++) {
    const w = 15 + Math.floor(r() * 50);
    const h = 20 + Math.floor(r() * 60);
    arr.push({ x, w, h });
    x += w + 3 + Math.floor(r() * 10);
  }
  return arr;
})();

const STARS = (() => {
  const r = prng(0xf00dcafe);
  return Array.from({ length: 20 }, () => ({
    xFrac: r(),
    yFrac: r() * 0.65,
    phase: r() * Math.PI * 2,
    period: 2000 + Math.floor(r() * 1500),
    radius: 0.8 + r() * 1.2,
  }));
})();

const MID_TOTAL_W = MID_BUILDINGS.at(-1).x + MID_BUILDINGS.at(-1).w + 40;
const NEAR_TOTAL_W = NEAR_BUILDINGS.at(-1).x + NEAR_BUILDINGS.at(-1).w + 40;

function ParallaxBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Pre-load background image (far layer)
    const bgImg = new Image();
    let bgLoaded = false;
    bgImg.onload = () => { bgLoaded = true; };
    bgImg.src = "/assets/utr-bg.png";

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const drawFrame = (elapsed) => {
      const W = canvas.width;
      const H = canvas.height;

      // Base sky
      ctx.fillStyle = GAME_BG_FALLBACK;
      ctx.fillRect(0, 0, W, H);

      // Stars — subtle opacity oscillation
      for (const star of STARS) {
        const alpha = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(elapsed / star.period + star.phase));
        ctx.fillStyle = `rgba(200,200,255,${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(star.xFrac * W, star.yFrac * H, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Far layer: utr-bg.png tiled horizontally at 5px/s
      if (bgLoaded) {
        const drawH = H;
        const drawW = bgImg.width * (H / bgImg.height);
        const offset = (elapsed * 5 / 1000) % drawW;
        ctx.globalAlpha = 0.55;
        for (let x = -offset; x < W + drawW; x += drawW) {
          ctx.drawImage(bgImg, Math.round(x), 0, Math.round(drawW), Math.round(drawH));
        }
        ctx.globalAlpha = 1;
      }

      // Mid layer: building silhouettes at 15px/s
      const midOffset = (elapsed * 15 / 1000) % MID_TOTAL_W;
      const groundMid = H * 0.72;
      ctx.fillStyle = "rgba(14,12,36,0.88)";
      for (let rep = -1; rep <= 2; rep++) {
        const dx = rep * MID_TOTAL_W - midOffset;
        for (const b of MID_BUILDINGS) {
          const bx = dx + b.x;
          if (bx + b.w < 0 || bx > W) continue;
          const bh = (b.h / 160) * H * 0.35;
          ctx.fillRect(Math.round(bx), Math.round(groundMid - bh), Math.round(b.w), Math.round(bh + 2));
        }
      }

      // Near layer: darker ground shapes at 30px/s
      const nearOffset = (elapsed * 30 / 1000) % NEAR_TOTAL_W;
      const groundNear = H * 0.84;
      ctx.fillStyle = "rgba(8,6,22,0.94)";
      for (let rep = -1; rep <= 2; rep++) {
        const dx = rep * NEAR_TOTAL_W - nearOffset;
        for (const b of NEAR_BUILDINGS) {
          const bx = dx + b.x;
          if (bx + b.w < 0 || bx > W) continue;
          const bh = (b.h / 80) * H * 0.15;
          ctx.fillRect(Math.round(bx), Math.round(groundNear - bh), Math.round(b.w), Math.round(bh + 2));
        }
      }
      // Solid ground strip
      ctx.fillStyle = "rgba(6,4,18,0.96)";
      ctx.fillRect(0, Math.round(groundNear), W, H - Math.round(groundNear));
    };

    // Reduced motion: draw one static frame and stop
    if (reduced) {
      drawFrame(0);
      return () => window.removeEventListener("resize", resize);
    }

    let loopId = null;
    let elapsed = 0;
    let lastTs = null;
    let running = true;

    const tick = (ts) => {
      if (!running) return;
      if (lastTs !== null) elapsed += ts - lastTs;
      lastTs = ts;
      drawFrame(elapsed);
      loopId = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (loopId) cancelAnimationFrame(loopId);
        loopId = null;
        lastTs = null; // Don't count the gap as elapsed
      } else {
        running = true;
        loopId = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    loopId = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (loopId) cancelAnimationFrame(loopId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

export default ParallaxBackground;
