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
          label={player ? `My Account (${player.username})` : "Log In"}
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

      {player && <p style={styles.loggedIn}>Logged in as {player.username}</p>}
    </div>
  );
}

function MenuButton({ label, onClick, primary, disabled, tooltip }) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltip || ""}
        style={{
          ...styles.btn,
          ...(primary ? styles.btnPrimary : {}),
          ...(disabled ? styles.btnDisabled : {}),
        }}
      >
        {label}
        {disabled && <span style={styles.lockIcon}>🔒</span>}
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
    gap: "2rem",
  },
  titleBlock: { textAlign: "center" },
  title: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#fff",
    margin: 0,
    letterSpacing: "2px",
  },
  subtitle: { fontSize: "16px", color: "#888", marginTop: "8px" },
  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "280px",
  },
  btn: {
    width: "100%",
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "500",
    borderRadius: "10px",
    border: "1px solid #444",
    background: "#2a2a3e",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.15s",
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btnPrimary: { background: "#534AB7", border: "1px solid #7F77DD" },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  lockIcon: { fontSize: "14px" },
  tooltip: {
    fontSize: "12px",
    color: "#888",
    marginTop: "4px",
    textAlign: "center",
  },
  loggedIn: { fontSize: "13px", color: "#666" },
};

export default MainMenu;
