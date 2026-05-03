import { useEffect, useRef } from "react";

// Sprite sheet constants — verified at 768×480 (6 frames × 3 rows, each frame 128×160)
const IDLE_FRAMES = [
  [0,   0, 128, 160],
  [128, 0, 128, 160],
  [256, 0, 128, 160],
  [384, 0, 128, 160],
];
const SHEET_W = 768;
const SHEET_H = 480;
const FRAME_W = 128;
const FRAME_H = 160;

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Animated idle-loop squid on a canvas.
 * size = display width in CSS px; height is auto-proportioned to the 4:5 frame ratio.
 * Respects prefers-reduced-motion (draws frame 0, no loop).
 */
export function SquidCanvas({ size = 48 }) {
  const h = Math.round(size * FRAME_H / FRAME_W);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = size;
    canvas.height = h;

    const img = new Image();
    img.src = "/assets/squid-sprite.png";

    const draw = (f) => {
      ctx.clearRect(0, 0, size, h);
      if (img.complete && img.naturalWidth > 0) {
        const [sx, sy, sw, sh] = IDLE_FRAMES[f];
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, h);
      }
    };

    if (reducedMotion) {
      img.onload = () => draw(0);
      if (img.complete && img.naturalWidth > 0) draw(0);
      return;
    }

    let frame = 0;
    let tick  = 0;
    let loopId;
    const animate = () => {
      tick++;
      if (tick % 8 === 0) frame = (frame + 1) % IDLE_FRAMES.length;
      draw(frame);
      loopId = requestAnimationFrame(animate);
    };
    img.onload = () => { loopId = requestAnimationFrame(animate); };
    if (img.complete && img.naturalWidth > 0) loopId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(loopId);
  }, [size, h]);

  // Explicit CSS width/height prevents flex containers from stretching the canvas.
  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", imageRendering: "pixelated", width: size, height: h }}
    />
  );
}

/**
 * Static frame-0 squid via CSS background-image — no canvas, no animation.
 * size = display width in CSS px; height is auto-proportioned.
 * backgroundSize is set to the full scaled sheet so backgroundPosition: "0 0"
 * isolates exactly frame 0 without overflow from adjacent frames or rows.
 */
export function SquidStatic({ size = 28 }) {
  const scale = size / FRAME_W;
  const h = Math.round(FRAME_H * scale);
  return (
    <div
      style={{
        width: size,
        height: h,
        backgroundImage: "url(/assets/squid-sprite.png)",
        backgroundPosition: "0 0",
        backgroundSize: `${Math.round(SHEET_W * scale)}px ${Math.round(SHEET_H * scale)}px`,
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
    />
  );
}
