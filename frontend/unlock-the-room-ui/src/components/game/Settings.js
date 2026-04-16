import { useState } from "react";

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
        style={{ ...styles.toggle, background: checked ? "#534AB7" : "#444" }}
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
    background: "#2a2a3e",
    border: "1px solid #444",
    borderRadius: "16px",
    padding: "2rem",
    width: "420px",
  },
  title: {
    color: "#fff",
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
    borderBottom: "1px solid #333",
  },
  rowText: { flex: 1, paddingRight: "16px" },
  rowLabel: { color: "#fff", fontSize: "14px", fontWeight: "500", margin: 0 },
  rowDesc: { color: "#888", fontSize: "12px", margin: "3px 0 0" },
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
    background: "#fff",
    transition: "transform 0.2s",
  },
  actions: { display: "flex", gap: "10px", marginTop: "1.5rem" },
  saveBtn: {
    flex: 1,
    padding: "10px",
    background: "#534AB7",
    color: "#fff",
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
    color: "#888",
    border: "1px solid #444",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
};

export default Settings;
