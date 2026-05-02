import { useState } from "react";
import { GAME_UI } from "../../gameColors";

function Settings({ settings, onSave, onBack }) {
  const [local, setLocal] = useState({ ...settings });

  const toggle = (key) => setLocal((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    onSave(local);
    onBack();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Settings</h2>

        <div style={styles.settingsList}>
          <SettingRow
            label="Show timer"
            description="Display elapsed time during gameplay"
            checked={local.showTimer}
            onChange={() => toggle("showTimer")}
          />
          <SettingRow
            label="Show controls"
            description="Display keyboard controls on screen"
            checked={local.showControls}
            onChange={() => toggle("showControls")}
          />
        </div>

        <div style={styles.actions}>
          <button style={styles.saveBtn} onClick={handleSave}>
            Save settings
          </button>
          <button style={styles.backBtn} onClick={onBack}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, description, checked, onChange }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowText}>
        <p style={styles.rowLabel}>{label}</p>
        <p style={styles.rowDesc}>{description}</p>
      </div>
      <div
        style={{ ...styles.toggle, background: checked ? "var(--color-primary)" : GAME_UI.cardBorder }}
        onClick={onChange}
      >
        <div
          style={{
            ...styles.toggleKnob,
            transform: checked ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: GAME_UI.cardBg,
    border: `1px solid ${GAME_UI.cardBorder}`,
    borderRadius: "16px",
    padding: "2rem",
    width: "420px",
  },
  title: {
    color: "white",
    fontSize: "22px",
    fontWeight: "600",
    marginBottom: "1.5rem",
  },
  settingsList: { display: "flex", flexDirection: "column", gap: "0" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: `1px solid ${GAME_UI.subtleBorder}`,
  },
  rowText: { flex: 1, paddingRight: "16px" },
  rowLabel: { color: "white", fontSize: "14px", fontWeight: "500", margin: 0 },
  rowDesc: { color: GAME_UI.textMuted, fontSize: "12px", margin: "3px 0 0" },
  toggle: {
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  toggleKnob: {
    position: "absolute",
    top: "2px",
    left: "2px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "white",
    transition: "transform 0.2s",
  },
  actions: { display: "flex", gap: "10px", marginTop: "1.5rem" },
  saveBtn: {
    flex: 1,
    padding: "10px",
    background: "var(--color-primary)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  backBtn: {
    flex: 1,
    padding: "10px",
    background: "transparent",
    color: GAME_UI.textMuted,
    border: `1px solid ${GAME_UI.cardBorder}`,
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
};

export default Settings;
