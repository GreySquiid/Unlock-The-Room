import { useState, useEffect, useRef } from "react";
import { GAME_UI, PLATFORM_COLORS } from "../../gameColors";
import ParallaxBackground from "./ParallaxBackground";

// Idle animation frames from the squid sprite sheet (row 0)
const IDLE_FRAMES = [
  [0,   0, 128, 160],
  [128, 0, 128, 160],
  [256, 0, 128, 160],
  [384, 0, 128, 160],
];
const SQUID_W = 64;
const SQUID_H = 80;
const PLAT_H  = 9;

function SquidCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = SQUID_W;
    canvas.height = SQUID_H + PLAT_H;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const img = new Image();
    img.src = "/assets/squid-sprite.png";

    const drawFrame = (f) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (img.complete && img.naturalWidth > 0) {
        const [sx, sy, sw, sh] = IDLE_FRAMES[f];
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SQUID_W, SQUID_H);
      }
      // Small platform underfoot — matches in-game platform art language
      ctx.fillStyle = PLATFORM_COLORS.topHighlight;   // purple top edge
      ctx.fillRect(0, SQUID_H, SQUID_W, 3);
      ctx.fillStyle = PLATFORM_COLORS.inner;          // lighter mid strip
      ctx.fillRect(0, SQUID_H + 3, SQUID_W, 4);
      ctx.fillStyle = PLATFORM_COLORS.body;           // dark body
      ctx.fillRect(0, SQUID_H + 7, SQUID_W, 1);
      ctx.fillStyle = PLATFORM_COLORS.bottomShadow;   // deepest shadow
      ctx.fillRect(0, SQUID_H + 8, SQUID_W, 1);
    };

    if (reduced) {
      const drawStatic = () => drawFrame(0);
      img.onload = drawStatic;
      if (img.complete && img.naturalWidth > 0) drawStatic();
      return;
    }

    let frame = 0;
    let tick  = 0;
    let loopId;

    const animate = () => {
      tick++;
      if (tick % 8 === 0) frame = (frame + 1) % IDLE_FRAMES.length;
      drawFrame(frame);
      loopId = requestAnimationFrame(animate);
    };

    loopId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(loopId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", imageRendering: "pixelated" }}
    />
  );
}

function MainMenu({ player, onNavigate }) {
  return (
    <>
      <ParallaxBackground />

      <div style={styles.container}>
        {/* Translucent panel behind content for readability */}
        <div style={styles.panel}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>Unlock The Room</h1>
            <p style={styles.subtitle}>A puzzle platformer by GreySquiid Studios</p>
          </div>

          {/* Menu column with squid peeking out to the right */}
          <div style={styles.menuRow}>
            <div style={styles.menu}>
              <MenuButton
                label="Play"
                onClick={() => onNavigate("levelSelect")}
                primary
              />
              <MenuButton
                label={player ? `My Account  (${player.username})` : "Log In"}
                onClick={() => onNavigate("login")}
              />
              <MenuButton
                label="Saved Levels"
                onClick={() => (player ? onNavigate("savedLevels") : null)}
                disabled={!player}
                tooltip={!player ? "Log in to access saved levels" : null}
              />
              <MenuButton label="Settings" onClick={() => onNavigate("settings")} />
            </div>

            {/* Squid mascot sitting on a platform to the right */}
            <div style={styles.squidWrapper}>
              <SquidCanvas />
            </div>
          </div>

          {player && (
            <p style={styles.loggedIn}>Logged in as {player.username}</p>
          )}
        </div>
      </div>
    </>
  );
}

function MenuButton({ label, onClick, primary, disabled, tooltip }) {
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    ...styles.btn,
    ...(primary ? styles.btnPrimary : {}),
    ...(disabled ? styles.btnDisabled : {}),
    ...(hovered && !disabled ? (primary ? styles.btnPrimaryHover : styles.btnHover) : {}),
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip || ""}
        style={baseStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span>{label}</span>
        {disabled && <span style={styles.lockIcon}>&#x1F512;</span>}
      </button>
      {tooltip && disabled && <p style={styles.tooltip}>{tooltip}</p>}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2.5rem",
    padding: "2.5rem 2.5rem 2rem",
    background: "rgba(8,6,22,0.62)",
    borderRadius: "18px",
    backdropFilter: "blur(6px)",
    border: `1px solid rgba(99,102,241,0.15)`,
  },
  titleBlock: { textAlign: "center" },
  title: {
    fontSize: "48px",
    fontWeight: "800",
    color: "white",
    margin: 0,
    letterSpacing: "3px",
    textTransform: "uppercase",
    textShadow: `0 0 40px rgba(127,119,221,0.5), 0 2px 8px rgba(0,0,0,0.5)`,
  },
  subtitle: {
    fontSize: "14px",
    color: GAME_UI.textSubtle,
    marginTop: "10px",
    letterSpacing: "0.5px",
  },
  menuRow: {
    position: "relative",
    width: "300px",
  },
  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "300px",
  },
  squidWrapper: {
    position: "absolute",
    bottom: 0,
    right: "-82px",
    zIndex: 2,
    pointerEvents: "none",
  },
  btn: {
    width: "100%",
    padding: "13px 20px",
    fontSize: "15px",
    fontWeight: "500",
    borderRadius: "10px",
    border: `1px solid ${GAME_UI.menuBtnBorder}`,
    background: GAME_UI.menuBtnBg,
    color: GAME_UI.textNormal,
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    letterSpacing: "0.2px",
  },
  btnHover: {
    background: GAME_UI.menuBtnHoverBg,
    border: `1px solid ${GAME_UI.menuBtnHoverBorder}`,
    color: "white",
  },
  btnPrimary: {
    background: "var(--color-primary)",
    border: `1px solid ${GAME_UI.accentPurple}`,
    color: "white",
    fontWeight: "600",
  },
  btnPrimaryHover: {
    background: GAME_UI.primaryHoverBg,
    border: `1px solid ${GAME_UI.primaryHoverBorder}`,
  },
  btnDisabled: { opacity: 0.38, cursor: "not-allowed" },
  lockIcon: { fontSize: "13px", opacity: 0.7 },
  tooltip: {
    fontSize: "11px",
    color: GAME_UI.textSubtle,
    marginTop: "4px",
    textAlign: "center",
  },
  loggedIn: {
    fontSize: "12px",
    color: GAME_UI.textLocked,
    letterSpacing: "0.3px",
  },
};

export default MainMenu;
