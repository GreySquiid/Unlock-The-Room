import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const IDLE_FRAMES = [
  [0,   0, 128, 160],
  [128, 0, 128, 160],
  [256, 0, 128, 160],
  [384, 0, 128, 160],
];
const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SquidStatic() {
  return (
    <div style={{ width: 64, height: 80, overflow: "hidden", imageRendering: "pixelated" }}>
      <img
        src="/assets/squid-sprite.png"
        alt="GreySquiid mascot"
        style={{ width: 256, height: 80, display: "block", imageRendering: "pixelated" }}
      />
    </div>
  );
}

function SquidAnimated() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = 64;
    canvas.height = 80;
    const img = new Image();
    img.src = "/assets/squid-sprite.png";
    let frame = 0;
    let tick  = 0;
    let loopId;
    const draw = (f) => {
      ctx.clearRect(0, 0, 64, 80);
      if (img.complete && img.naturalWidth > 0) {
        const [sx, sy, sw, sh] = IDLE_FRAMES[f];
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 64, 80);
      }
    };
    if (reducedMotion) {
      img.onload = () => draw(0);
      if (img.complete && img.naturalWidth > 0) draw(0);
      return;
    }
    const animate = () => {
      tick++;
      if (tick % 8 === 0) frame = (frame + 1) % IDLE_FRAMES.length;
      draw(frame);
      loopId = requestAnimationFrame(animate);
    };
    img.onload = () => { loopId = requestAnimationFrame(animate); };
    if (img.complete && img.naturalWidth > 0) loopId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(loopId);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ imageRendering: "pixelated", display: "block" }}
    />
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.squidWrap}>
          {reducedMotion ? <SquidStatic /> : <SquidAnimated />}
        </div>
        <h1 style={styles.code}>404</h1>
        <p style={styles.message}>This room doesn't exist.</p>
        <p style={styles.sub}>
          The page you're looking for has been moved, deleted, or never existed.
        </p>
        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={() => navigate("/")}>
            Back to home
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate("/play")}>
            Play the game
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--surface-subtle)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "2rem",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border-light)",
    borderRadius: "16px",
    padding: "3rem 2.5rem",
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  squidWrap: { marginBottom: "8px" },
  code: {
    fontSize: "4rem",
    fontWeight: "800",
    color: "var(--color-primary)",
    margin: 0,
    lineHeight: 1,
    letterSpacing: "-2px",
  },
  message: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "var(--text)",
    margin: 0,
  },
  sub: {
    fontSize: "14px",
    color: "var(--text-subtle)",
    margin: 0,
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryBtn: {
    padding: "10px 20px",
    background: "var(--color-primary)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "transparent",
    color: "var(--color-primary)",
    border: "1px solid var(--color-primary)",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default NotFound;
