import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { BARRIER_COLORS, OBJECT_COLORS } from "../gameColors";

const AI_SQUID_FRAMES = [
  [0,   0, 128, 160],
  [128, 0, 128, 160],
  [256, 0, 128, 160],
  [384, 0, 128, 160],
];
const aiReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SquidLoader() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = 48;
    canvas.height = 60;
    const img = new Image();
    img.src = "/assets/squid-sprite.png";
    let frame = 0;
    let tick  = 0;
    let loopId;
    const draw = (f) => {
      ctx.clearRect(0, 0, 48, 60);
      if (img.complete && img.naturalWidth > 0) {
        const [sx, sy, sw, sh] = AI_SQUID_FRAMES[f];
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 48, 60);
      }
    };
    if (aiReducedMotion) {
      img.onload = () => draw(0);
      if (img.complete && img.naturalWidth > 0) draw(0);
      return;
    }
    const animate = () => {
      tick++;
      if (tick % 8 === 0) frame = (frame + 1) % AI_SQUID_FRAMES.length;
      draw(frame);
      loopId = requestAnimationFrame(animate);
    };
    img.onload = () => { loopId = requestAnimationFrame(animate); };
    if (img.complete && img.naturalWidth > 0) loopId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(loopId);
  }, []);
  return <canvas ref={canvasRef} style={{ imageRendering: "pixelated", display: "block" }} />;
}

function AiGenerator() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => ({
    difficulty:      searchParams.get("difficulty")     || "Medium",
    rows:            parseInt(searchParams.get("rows"))  || 18,
    columns:         parseInt(searchParams.get("columns")) || 24,
    keyCount:        parseInt(searchParams.get("keyCount")) || 3,
    includeHazards:  searchParams.get("includeHazards") !== "false",
    levelName:       searchParams.get("levelName")       || "",
    layoutArchetype: searchParams.get("layoutArchetype") || "",
    layoutDensity:   searchParams.get("layoutDensity")  || "Moderate",
    campaignRole:    searchParams.get("campaignRole")    || "",
  }));
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playtesting, setPlaytesting] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const navigate = useNavigate();

  // Show confirmation when returning from a playtest
  useEffect(() => {
    if (searchParams.get("saved")) {
      setSavedMessage("Level saved and playtested! View it in Level Management.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setPreview(null);
    setSavedMessage("");
    setLoading(true);
    try {
      const res = await api.post("/Ai/generate-preview", form);
      setPreview(res.data);
    } catch {
      setError(
        "AI generation failed. Please check your API key and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/Ai/save-preview", preview);
      setSavedMessage("Level saved successfully! View it in Level Management.");
    } catch {
      setError("Failed to save level. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPlaytest = async () => {
    if (!preview) return;
    setPlaytesting(true);
    setError("");
    try {
      const res = await api.post("/Ai/save-preview", preview);
      const levelId = res.data?.id;
      if (!levelId) throw new Error("No level ID returned");
      const params = new URLSearchParams({
        level:          String(levelId),
        from:           "ai-generator",
        difficulty:     form.difficulty,
        rows:           String(form.rows),
        columns:        String(form.columns),
        keyCount:       String(form.keyCount),
        includeHazards: String(form.includeHazards),
        levelName:      form.levelName,
        layoutArchetype:form.layoutArchetype,
        layoutDensity:  form.layoutDensity,
        campaignRole:   form.campaignRole,
      });
      navigate(`/play?${params.toString()}`);
    } catch {
      setError("Failed to save level before playtesting. Please try again.");
    } finally {
      setPlaytesting(false);
    }
  };

  const renderGrid = (level) => {
    const cellSize = Math.min(
      Math.floor(560 / level.columns),
      Math.floor(400 / level.rows),
    );

    const grid = Array.from({ length: level.rows }, () =>
      Array(level.columns).fill(null),
    );

    level.gameObjects.forEach((obj) => {
      for (let r = 0; r < obj.height; r++) {
        for (let c = 0; c < obj.width; c++) {
          const row = obj.positionY + r;
          const col = obj.positionX + c;
          if (row >= 0 && col >= 0 && row < level.rows && col < level.columns) {
            grid[row][col] = obj;
          }
        }
      }
    });

    return (
      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "inline-block",
            border: "1px solid var(--border-divider)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: "flex" }}>
              {row.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  title={
                    cell
                      ? `${cell.objectType}${cell.color ? ` (${cell.color})` : ""}${cell.hazardType ? ` - ${cell.hazardType}` : ""}`
                      : ""
                  }
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: cell
                      ? cell.objectType === "Key" ||
                        cell.objectType === "Barrier"
                        ? BARRIER_COLORS[cell.color] || OBJECT_COLORS[cell.objectType]
                        : OBJECT_COLORS[cell.objectType] || "var(--border-strong)"
                      : "var(--surface-subtle)",
                    border: "0.5px solid var(--border-light)",
                    opacity: cell?.objectType === "Barrier" ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.max(cellSize * 0.4, 8),
                    cursor: cell ? "default" : "default",
                  }}
                >
                  {cell && cellSize >= 20 ? getIcon(cell.objectType) : ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case "Key":      return "🗝";
      case "Barrier":  return "▪";
      case "Button":   return "⬛";
      case "Hazard":   return "▲";
      case "ExitDoor": return "🚪";
      default:         return "";
    }
  };

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        <h1 style={styles.title}>AI level generator</h1>
        <p style={styles.subtitle}>
          Describe your constraints and let the AI design a puzzle level for
          you.
        </p>

        <div style={styles.layout}>
          <form onSubmit={handleGenerate} style={styles.formCard}>
            <p style={styles.sectionLabel}>Level constraints</p>

            <div style={styles.field}>
              <label style={styles.label}>Level name (optional)</label>
              <input
                style={styles.input}
                value={form.levelName}
                onChange={(e) =>
                  setForm({ ...form, levelName: e.target.value })
                }
                placeholder="AI will generate a name if left blank"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Difficulty</label>
              <select
                style={styles.input}
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Rows</label>
                <input
                  style={styles.input}
                  type="number"
                  min="12"
                  max="24"
                  value={form.rows}
                  onChange={(e) =>
                    setForm({ ...form, rows: parseInt(e.target.value) })
                  }
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Columns</label>
                <input
                  style={styles.input}
                  type="number"
                  min="16"
                  max="32"
                  value={form.columns}
                  onChange={(e) =>
                    setForm({ ...form, columns: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Number of keys</label>
              <select
                style={styles.input}
                value={form.keyCount}
                onChange={(e) =>
                  setForm({ ...form, keyCount: parseInt(e.target.value) })
                }
              >
                <option value={1}>1 key</option>
                <option value={2}>2 keys</option>
                <option value={3}>3 keys</option>
                <option value={4}>4 keys</option>
                <option value={5}>5 keys</option>
              </select>
            </div>

            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.includeHazards}
                  onChange={(e) =>
                    setForm({ ...form, includeHazards: e.target.checked })
                  }
                />
                Include hazards (spikes / kill bricks)
              </label>
            </div>

            <p style={{ ...styles.sectionLabel, marginTop: "4px" }}>Design style</p>

            <div style={styles.field}>
              <label style={styles.label}>Layout archetype</label>
              <select
                style={styles.input}
                value={form.layoutArchetype}
                onChange={(e) => setForm({ ...form, layoutArchetype: e.target.value })}
              >
                <option value="">(Random)</option>
                <option value="ExitTower">Exit Tower</option>
                <option value="LongBaseRoute">Long Base Route</option>
                <option value="ChamberPuzzle">Chamber Puzzle</option>
                <option value="SnakeCorridor">Snake Corridor</option>
                <option value="OpenMinimalist">Open Minimalist</option>
                <option value="SplitVerticalGates">Split Vertical Gates</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Layout density</label>
              <select
                style={styles.input}
                value={form.layoutDensity}
                onChange={(e) => setForm({ ...form, layoutDensity: e.target.value })}
              >
                <option value="Sparse">Sparse</option>
                <option value="Moderate">Moderate</option>
                <option value="Dense">Dense</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Campaign role</label>
              <select
                style={styles.input}
                value={form.campaignRole}
                onChange={(e) => setForm({ ...form, campaignRole: e.target.value })}
              >
                <option value="">(Auto from difficulty)</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Early">Early</option>
                <option value="Mid">Mid</option>
                <option value="Late">Late</option>
                <option value="Challenge">Challenge</option>
              </select>
            </div>

            <button
              style={{ ...styles.generateBtn, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate level"}
            </button>
          </form>

          <div style={styles.previewPanel}>
            {!preview && !loading && (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>No level generated yet</p>
                <p style={styles.emptyText}>
                  Set your constraints and click Generate level to create an
                  AI-designed puzzle.
                </p>
              </div>
            )}
            {loading && (
              <div style={styles.emptyState}>
                <SquidLoader />
                <p style={styles.emptyTitle}>Generating your level…</p>
                <p style={styles.emptyText}>
                  The AI is designing your puzzle. This usually takes 5–10 seconds.
                </p>
              </div>
            )}
            {error && <p style={styles.error}>{error}</p>}

            {preview && (
              <>
                <div style={styles.previewHeader}>
                  <div>
                    <p style={styles.previewTitle}>{preview.name}</p>
                    <p style={styles.previewMeta}>
                      {preview.difficulty} · {preview.rows} × {preview.columns}{" "}
                      grid · {preview.gameObjects.length} objects
                    </p>
                    {preview.archetype && (
                      <span style={styles.archetypeBadge}>{preview.archetype}</span>
                    )}
                  </div>
                  <div style={styles.previewActions}>
                    <button
                      style={styles.regenBtn}
                      onClick={handleGenerate}
                      disabled={loading}
                    >
                      Regenerate
                    </button>
                    <button
                      style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
                      onClick={handleSave}
                      disabled={saving || playtesting}
                    >
                      {saving ? "Saving..." : "Save to library"}
                    </button>
                    <button
                      style={{ ...styles.playtestBtn, opacity: playtesting ? 0.7 : 1 }}
                      onClick={handleSaveAndPlaytest}
                      disabled={saving || playtesting}
                    >
                      {playtesting ? "Saving..." : "Save & playtest"}
                    </button>
                  </div>
                </div>

                {savedMessage && <p style={styles.success}>{savedMessage}</p>}

                {preview.validationWarnings && preview.validationWarnings.length > 0 && (
                  <div style={styles.warnings}>
                    <p style={styles.warningsLabel}>Design token warnings</p>
                    {preview.validationWarnings.map((w, i) => (
                      <p key={i} style={styles.warningItem}>⚠ {w}</p>
                    ))}
                  </div>
                )}

                <div style={styles.gridWrap}>{renderGrid(preview)}</div>

                <div style={styles.legend}>
                  {[
                    { label: "Key",         color: OBJECT_COLORS.Key },
                    { label: "Barrier",     color: OBJECT_COLORS.Barrier },
                    { label: "Button",      color: OBJECT_COLORS.Button },
                    { label: "Hazard",      color: OBJECT_COLORS.Hazard },
                    { label: "Exit door",   color: OBJECT_COLORS.ExitDoor },
                    { label: "White (exit)",color: BARRIER_COLORS.White, border: "1px solid var(--border-strong)" },
                  ].map((item) => (
                    <div key={item.label} style={styles.legendItem}>
                      <div style={{ ...styles.legendDot, background: item.color, border: item.border }} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                  {Object.entries(BARRIER_COLORS).filter(([k]) => k !== 'White').map(([name, color]) => (
                    <div key={name} style={styles.legendItem}>
                      <div style={{ ...styles.legendDot, background: color }} />
                      <span style={{ color: "var(--text-dim)" }}>{name}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.reasoning}>
                  <p style={styles.reasoningLabel}>AI design reasoning</p>
                  <p style={styles.reasoningText}>{preview.aiReasoning}</p>
                </div>

                <div style={styles.objectList}>
                  <p style={styles.reasoningLabel}>Objects in this level</p>
                  <div style={styles.objectGrid}>
                    {preview.gameObjects.map((obj, i) => (
                      <div key={i} style={styles.objectTag}>
                        <span
                          style={{
                            ...styles.objectDot,
                            background: obj.color
                              ? BARRIER_COLORS[obj.color]
                              : OBJECT_COLORS[obj.objectType],
                          }}
                        />
                        {obj.objectType}
                        {obj.color ? ` (${obj.color})` : ""}
                        {obj.hazardType ? ` - ${obj.hazardType}` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "2rem 2.5rem" },
  title: { fontSize: "22px", fontWeight: "600", marginBottom: "4px" },
  subtitle: { fontSize: "14px", color: "var(--text-dim)", marginBottom: "1.5rem" },
  layout: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  formCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "12px", fontWeight: "500", color: "var(--text-muted)" },
  input: {
    padding: "7px 10px",
    border: "1px solid var(--border-divider)",
    borderRadius: "8px",
    fontSize: "13px",
    background: "var(--surface)",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  checkboxRow: { display: "flex", alignItems: "center" },
  checkboxLabel: {
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  generateBtn: {
    padding: "10px",
    background: "var(--color-primary)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "4px",
  },
  previewPanel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "1.25rem",
    minHeight: "400px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    textAlign: "center",
  },
  emptyTitle: { fontSize: "15px", fontWeight: "500", marginBottom: "8px" },
  emptyText: { fontSize: "13px", color: "var(--text-subtle)", maxWidth: "280px" },
  error: {
    color: "var(--color-danger)",
    fontSize: "13px",
    padding: "10px",
    background: "var(--color-danger-bg-subtle)",
    border: "1px solid var(--color-danger-border)",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  success: {
    color: "var(--color-success-text)",
    fontSize: "13px",
    padding: "10px",
    background: "var(--color-success-bg)",
    border: "1px solid var(--color-success-bg)",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
  },
  previewTitle: { fontSize: "16px", fontWeight: "600", marginBottom: "4px" },
  previewMeta: { fontSize: "12px", color: "var(--text-subtle)" },
  previewActions: { display: "flex", gap: "8px" },
  regenBtn: {
    padding: "6px 14px",
    background: "var(--surface)",
    border: "1px solid var(--border-divider)",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "6px 14px",
    background: "var(--color-primary)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
  },
  playtestBtn: {
    padding: "6px 14px",
    background: "var(--color-success)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
  },
  archetypeBadge: {
    display: "inline-block",
    marginTop: "5px",
    padding: "2px 8px",
    background: "var(--color-primary-bg)",
    color: "var(--color-primary)",
    border: "1px solid var(--color-primary-border)",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.3px",
  },
  warnings: {
    background: "var(--color-warning-bg)",
    border: "1px solid var(--color-warning-border)",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "12px",
  },
  warningsLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--color-warning-text)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px",
  },
  warningItem: {
    fontSize: "12px",
    color: "var(--color-warning-text)",
    margin: "3px 0 0",
    lineHeight: "1.5",
  },
  gridWrap: { marginBottom: "1rem" },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "1rem",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  legendItem: { display: "flex", alignItems: "center", gap: "5px" },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "2px",
    flexShrink: 0,
  },
  reasoning: {
    background: "var(--surface-subtle)",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "1rem",
  },
  reasoningLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px",
  },
  reasoningText: { fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" },
  objectList: { background: "var(--surface-subtle)", borderRadius: "8px", padding: "12px" },
  objectGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "6px",
  },
  objectTag: {
    fontSize: "11px",
    padding: "3px 8px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "99px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  objectDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
};

export default AiGenerator;
