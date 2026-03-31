import { useState } from "react";

function MainMenu({ player, onNavigate }) {
  return (
    <div style={styles.container}>
      <div style={styles.titleBlock}>
        <h1 style={styles.title}>Unlock The Room</h1>
        <p style={styles.subtitle}>A puzzle platformer by GreySquiid Studios</p>
      </div>

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

      {player && (
        <p style={styles.loggedIn}>Logged in as {player.username}</p>
      )}
    </div>
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2.5rem",
  },
  titleBlock: { textAlign: "center" },
  title: {
    fontSize: "48px",
    fontWeight: "800",
    color: "#fff",
    margin: 0,
    letterSpacing: "3px",
    textTransform: "uppercase",
    textShadow: "0 0 40px rgba(127,119,221,0.5), 0 2px 8px rgba(0,0,0,0.5)",
  },
  subtitle: {
    fontSize: "14px",
    color: "#5a5a7a",
    marginTop: "10px",
    letterSpacing: "0.5px",
  },
  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "300px",
  },
  btn: {
    width: "100%",
    padding: "13px 20px",
    fontSize: "15px",
    fontWeight: "500",
    borderRadius: "10px",
    border: "1px solid #363654",
    background: "#222238",
    color: "#d0d0d0",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    letterSpacing: "0.2px",
  },
  btnHover: {
    background: "#2c2c4a",
    border: "1px solid #4a4a6a",
    color: "#fff",
  },
  btnPrimary: {
    background: "#534AB7",
    border: "1px solid #7F77DD",
    color: "#fff",
    fontWeight: "600",
  },
  btnPrimaryHover: {
    background: "#6258cc",
    border: "1px solid #9590e8",
  },
  btnDisabled: { opacity: 0.38, cursor: "not-allowed" },
  lockIcon: { fontSize: "13px", opacity: 0.7 },
  tooltip: {
    fontSize: "11px",
    color: "#5a5a7a",
    marginTop: "4px",
    textAlign: "center",
  },
  loggedIn: {
    fontSize: "12px",
    color: "#444466",
    letterSpacing: "0.3px",
  },
};

export default MainMenu;
