import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";

const CELL = 32;
const MAX_HISTORY = 50;

const COLORS = {
  Red: "#E24B4A",
  Blue: "#378ADD",
  Green: "#639922",
  Yellow: "#EF9F27",
  Purple: "#7F77DD",
  White: "#E8E8E8",
};

const OBJECT_COLORS = {
  Platform: "#4a4a6a",
  ExitDoor: "#1D9E75",
  Hazard: "#888",
  KillBrick: "#C0392B",
  SpawnPoint: "#378ADD",
};

const OBJECT_TYPES = ["Platform", "Key", "Barrier", "Hazard", "KillBrick", "ExitDoor", "SpawnPoint"];
const COLOR_OPTIONS = ["Red", "Blue", "Green", "Yellow", "Purple", "White"];

function cellColor(obj) {
  if (obj.objectType === "Key") return COLORS[obj.color] || "#EF9F27";
  if (obj.objectType === "Barrier") return COLORS[obj.color] || "#888";
  return OBJECT_COLORS[obj.objectType] || "#555";
}

function cellLabel(obj) {
  const labels = {
    Platform: "P",
    Key: "K",
    Barrier: "B",
    Hazard: "H",
    KillBrick: "X",
    ExitDoor: "E",
    SpawnPoint: "S",
  };
  return labels[obj.objectType] || "?";
}

function buildOccupancyMap(objects) {
  const map = {};
  for (const obj of objects) {
    for (let dy = 0; dy < obj.height; dy++) {
      for (let dx = 0; dx < obj.width; dx++) {
        map[`${obj.positionX + dx},${obj.positionY + dy}`] = obj;
      }
    }
  }
  return map;
}

export default function LevelEditor({ level: initialLevel, onClose, onPlayTest }) {
  const [level, setLevel] = useState(initialLevel);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Metadata editing
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaForm, setMetaForm] = useState({
    name: initialLevel.name,
    difficulty: initialLevel.difficulty,
    rows: initialLevel.rows,
    columns: initialLevel.columns,
  });
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaMsg, setMetaMsg] = useState("");

  // Sidebar tool state
  const [tool, setTool] = useState("Platform");
  const [color, setColor] = useState("Red");
  const [hazardType] = useState("Spike");
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);

  // Undo history
  const historyRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  // Drag state
  const dragRef = useRef(null); // { obj, ghostCol, ghostRow }
  const [ghostCell, setGhostCell] = useState(null); // { col, row } during drag

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/Levels/${level.id}/detail`);
        const raw = res.data.gameObjects || [];
        const normalised = raw.map((o) => ({
          ...o,
          objectType:
            o.objectType === "Hazard" && o.hazardType === "Platform"
              ? "Platform"
              : o.objectType === "Hazard" && o.hazardType === "KillBrick"
              ? "KillBrick"
              : o.objectType,
        }));
        setObjects(normalised);
      } catch {
        setObjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [level.id]);

  // Keyboard shortcut for undo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const pushHistory = useCallback((currentObjects) => {
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), currentObjects];
    setCanUndo(true);
  }, []);

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setObjects(prev);
    setCanUndo(historyRef.current.length > 0);
  };

  const occupancy = buildOccupancyMap(objects);

  const handleCellClick = useCallback(
    (col, row, isRightClick, currentObjects) => {
      const key = `${col},${row}`;
      const existing = occupancy[key];

      if (isRightClick) {
        if (!existing) return;
        pushHistory(currentObjects);
        setObjects((prev) => prev.filter((o) => o !== existing));
        return;
      }

      const newObj = {
        id: 0,
        objectType: tool,
        positionX: col,
        positionY: row,
        width,
        height,
        color: tool === "Key" || tool === "Barrier" ? color : null,
        hazardType: tool === "Hazard" ? hazardType : null,
      };

      pushHistory(currentObjects);
      setObjects((prev) => {
        const overlapping = new Set();
        for (let dy = 0; dy < height; dy++) {
          for (let dx = 0; dx < width; dx++) {
            const hit = occupancy[`${col + dx},${row + dy}`];
            if (hit) overlapping.add(hit);
          }
        }
        const filtered = prev.filter((o) => !overlapping.has(o));
        return [...filtered, newObj];
      });
    },
    [occupancy, tool, color, hazardType, width, height, pushHistory]
  );

  const handleMouseDown = (e, col, row) => {
    e.preventDefault();
    const key = `${col},${row}`;
    const existing = occupancy[key];

    if (e.button === 2) {
      handleCellClick(col, row, true, objects);
      return;
    }

    if (existing && e.button === 0) {
      // Start drag
      dragRef.current = { obj: existing, ghostCol: col, ghostRow: row };
      setGhostCell({ col, row });
    } else if (e.button === 0) {
      handleCellClick(col, row, false, objects);
    }
  };

  const handleMouseEnter = (e, col, row) => {
    if (dragRef.current) {
      // Update ghost position
      setGhostCell({ col, row });
      dragRef.current.ghostCol = col;
      dragRef.current.ghostRow = row;
      return;
    }
    if (e.buttons === 1) {
      // Paint mode (dragging on empty cells)
      const key = `${col},${row}`;
      if (!occupancy[key]) {
        handleCellClick(col, row, false, objects);
      }
    }
  };

  const handleMouseUp = () => {
    if (!dragRef.current) return;
    const { obj, ghostCol, ghostRow } = dragRef.current;
    dragRef.current = null;
    setGhostCell(null);

    // Don't do anything if dropped in same spot
    if (ghostCol === obj.positionX && ghostRow === obj.positionY) return;

    pushHistory(objects);
    setObjects((prev) => {
      // Remove original + anything at drop target
      const overlapping = new Set();
      for (let dy = 0; dy < obj.height; dy++) {
        for (let dx = 0; dx < obj.width; dx++) {
          const hit = occupancy[`${ghostCol + dx},${ghostRow + dy}`];
          if (hit && hit !== obj) overlapping.add(hit);
        }
      }
      const filtered = prev.filter((o) => o !== obj && !overlapping.has(o));
      return [...filtered, { ...obj, positionX: ghostCol, positionY: ghostRow }];
    });
  };

  const handleContextMenu = (e) => e.preventDefault();

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const payload = objects.map((o) => ({
        id: o.id,
        objectType:
          o.objectType === "Platform"
            ? "Platform"
            : o.objectType === "KillBrick"
            ? "KillBrick"
            : o.objectType,
        positionX: o.positionX,
        positionY: o.positionY,
        width: o.width,
        height: o.height,
        color: o.color,
        hazardType:
          o.objectType === "Platform"
            ? "Platform"
            : o.objectType === "KillBrick"
            ? "KillBrick"
            : o.hazardType,
      }));
      await api.put(`/Levels/${level.id}/objects`, payload);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleMetaSave = async () => {
    setMetaSaving(true);
    setMetaMsg("");
    try {
      await api.put(`/Levels/${level.id}`, {
        name: metaForm.name,
        difficulty: metaForm.difficulty,
        rows: metaForm.rows,
        columns: metaForm.columns,
        isPublished: level.isPublished,
      });
      setLevel((prev) => ({ ...prev, ...metaForm }));
      setMetaMsg("Saved!");
      setMetaOpen(false);
      setTimeout(() => setMetaMsg(""), 2000);
    } catch {
      setMetaMsg("Failed.");
    } finally {
      setMetaSaving(false);
    }
  };

  const rows = level.rows;
  const cols = level.columns;
  const gridW = cols * CELL;
  const gridH = rows * CELL;

  // Boundary wall cells: col 0, col cols-1, row rows-1
  const isBoundaryWall = (col, row) =>
    col === 0 || col === cols - 1 || row === rows - 1;

  // Object blending: check if a neighbor in a direction has the same type
  const hasSameNeighbor = (obj, direction) => {
    const dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    const dy = direction === "top" ? -1 : direction === "bottom" ? 1 : 0;

    // Check each cell on the shared edge
    if (direction === "left" || direction === "right") {
      for (let r = 0; r < obj.height; r++) {
        const neighborKey = `${obj.positionX + (direction === "right" ? obj.width : -1)},${obj.positionY + r}`;
        const neighbor = occupancy[neighborKey];
        if (neighbor && neighbor !== obj && neighbor.objectType === obj.objectType && neighbor.color === obj.color) return true;
      }
    } else {
      for (let c = 0; c < obj.width; c++) {
        const neighborKey = `${obj.positionX + c},${obj.positionY + (direction === "bottom" ? obj.height : -1)}`;
        const neighbor = occupancy[neighborKey];
        if (neighbor && neighbor !== obj && neighbor.objectType === obj.objectType && neighbor.color === obj.color) return true;
      }
    }
    return false;
  };

  return (
    <div style={styles.overlay} onContextMenu={handleContextMenu} onMouseUp={handleMouseUp}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerTitle}>Edit Level</span>
            <span style={styles.headerSub}>{level.name}</span>
            <span style={styles.headerDim}>
              {cols} × {rows}
            </span>
            <button
              style={styles.btnMeta}
              onClick={() => {
                setMetaForm({ name: level.name, difficulty: level.difficulty, rows: level.rows, columns: level.columns });
                setMetaOpen((v) => !v);
              }}
            >
              {metaOpen ? "▲ Settings" : "▼ Settings"}
            </button>
          </div>
          <div style={styles.headerActions}>
            {(saveMsg || metaMsg) && (
              <span
                style={{
                  ...styles.saveMsg,
                  color: (saveMsg === "Saved!" || metaMsg === "Saved!") ? "#2e7d32" : "#c0392b",
                }}
              >
                {saveMsg || metaMsg}
              </span>
            )}
            <button
              style={{ ...styles.btnSave, ...(canUndo ? {} : { opacity: 0.4 }) }}
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              ↩ Undo
            </button>
            <button style={styles.btnSave} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button style={styles.btnPlayTest} onClick={() => onPlayTest(level)}>
              Play Test
            </button>
            <button style={styles.btnClose} onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Collapsible metadata form */}
        {metaOpen && (
          <div style={styles.metaBar}>
            <div style={styles.metaFields}>
              <div style={styles.metaField}>
                <label style={styles.metaLabel}>Name</label>
                <input
                  style={styles.metaInput}
                  value={metaForm.name}
                  onChange={(e) => setMetaForm({ ...metaForm, name: e.target.value })}
                />
              </div>
              <div style={styles.metaField}>
                <label style={styles.metaLabel}>Difficulty</label>
                <select
                  style={styles.metaInput}
                  value={metaForm.difficulty}
                  onChange={(e) => setMetaForm({ ...metaForm, difficulty: e.target.value })}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div style={styles.metaField}>
                <label style={styles.metaLabel}>Rows</label>
                <input
                  style={{ ...styles.metaInput, width: "60px" }}
                  type="number"
                  min="5"
                  max="30"
                  value={metaForm.rows}
                  onChange={(e) => setMetaForm({ ...metaForm, rows: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div style={styles.metaField}>
                <label style={styles.metaLabel}>Columns</label>
                <input
                  style={{ ...styles.metaInput, width: "60px" }}
                  type="number"
                  min="5"
                  max="30"
                  value={metaForm.columns}
                  onChange={(e) => setMetaForm({ ...metaForm, columns: parseInt(e.target.value) || 10 })}
                />
              </div>
              <button style={styles.btnSave} onClick={handleMetaSave} disabled={metaSaving}>
                {metaSaving ? "Saving..." : "Apply"}
              </button>
              <button style={styles.btnClose} onClick={() => setMetaOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={styles.body}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            <p style={styles.sidebarSection}>Object type</p>
            <div style={styles.typeList}>
              {OBJECT_TYPES.map((t) => (
                <button
                  key={t}
                  style={{
                    ...styles.typeBtn,
                    ...(tool === t ? styles.typeBtnActive : {}),
                  }}
                  onClick={() => setTool(t)}
                >
                  <span
                    style={{
                      ...styles.typeDot,
                      background:
                        t === "Key" || t === "Barrier"
                          ? COLORS[color]
                          : OBJECT_COLORS[t] || "#555",
                      opacity: t === "Barrier" ? 0.7 : 1,
                    }}
                  />
                  {t}
                </button>
              ))}
            </div>

            {(tool === "Key" || tool === "Barrier") && (
              <>
                <p style={{ ...styles.sidebarSection, marginTop: "14px" }}>Color</p>
                <div style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      title={c}
                      style={{
                        ...styles.colorSwatch,
                        background: COLORS[c],
                        border:
                          color === c
                            ? "2px solid #185FA5"
                            : "2px solid transparent",
                        outline:
                          c === "White" ? "1px solid #ccc" : "none",
                      }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <p style={styles.colorLabel}>{color}</p>
              </>
            )}

            {tool === "Hazard" && (
              <>
                <p style={{ ...styles.sidebarSection, marginTop: "14px" }}>Hazard type</p>
                <p style={styles.staticValue}>Spike</p>
              </>
            )}

            {tool !== "KillBrick" && (
              <>
                <p style={{ ...styles.sidebarSection, marginTop: "14px" }}>Size</p>
                <div style={styles.sizeRow}>
                  <div style={styles.sizeField}>
                    <label style={styles.sizeLabel}>W</label>
                    <input
                      style={styles.sizeInput}
                      type="number"
                      min="1"
                      max="8"
                      value={width}
                      onChange={(e) =>
                        setWidth(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))
                      }
                    />
                  </div>
                  <div style={styles.sizeField}>
                    <label style={styles.sizeLabel}>H</label>
                    <input
                      style={styles.sizeInput}
                      type="number"
                      min="1"
                      max="4"
                      value={height}
                      onChange={(e) =>
                        setHeight(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <p style={{ ...styles.sidebarSection, marginTop: "20px" }}>Legend</p>
            <div style={styles.legend}>
              {[
                { label: "Platform", color: "#4a4a6a" },
                { label: "Key", color: "#EF9F27" },
                { label: "Barrier", color: "#378ADD", opacity: 0.7 },
                { label: "Hazard (spike)", color: "#888" },
                { label: "Kill Brick", color: "#C0392B" },
                { label: "Exit Door", color: "#1D9E75" },
                { label: "Spawn", color: "#378ADD" },
              ].map((item) => (
                <div key={item.label} style={styles.legendRow}>
                  <span
                    style={{
                      ...styles.legendDot,
                      background: item.color,
                      opacity: item.opacity || 1,
                    }}
                  />
                  <span style={styles.legendLabel}>{item.label}</span>
                </div>
              ))}
            </div>

            <p style={styles.hint}>
              Left-click: place &nbsp;·&nbsp; Right-click: delete
              <br />
              Drag existing object to move
            </p>
          </div>

          {/* Grid */}
          <div style={styles.gridWrapper}>
            {loading ? (
              <p style={styles.loadingText}>Loading level objects...</p>
            ) : (
              <div
                style={{
                  width: gridW,
                  height: gridH,
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {/* Boundary wall background tiles */}
                {Array.from({ length: rows }, (_, row) =>
                  Array.from({ length: cols }, (_, col) => {
                    if (!isBoundaryWall(col, row)) return null;
                    return (
                      <div
                        key={`wall-${col}-${row}`}
                        style={{
                          position: "absolute",
                          left: col * CELL,
                          top: row * CELL,
                          width: CELL,
                          height: CELL,
                          background: "#2e2e48",
                          borderRight: "1px solid #3a3a58",
                          borderBottom: "1px solid #3a3a58",
                          boxSizing: "border-box",
                          pointerEvents: "none",
                          zIndex: 0,
                        }}
                      />
                    );
                  })
                )}

                {/* Grid lines */}
                <svg
                  style={styles.gridSvg}
                  width={gridW}
                  height={gridH}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {Array.from({ length: cols + 1 }, (_, x) => (
                    <line
                      key={`v${x}`}
                      x1={x * CELL}
                      y1={0}
                      x2={x * CELL}
                      y2={gridH}
                      stroke="#e0e0e0"
                      strokeWidth="0.5"
                    />
                  ))}
                  {Array.from({ length: rows + 1 }, (_, y) => (
                    <line
                      key={`h${y}`}
                      x1={0}
                      y1={y * CELL}
                      x2={gridW}
                      y2={y * CELL}
                      stroke="#e0e0e0"
                      strokeWidth="0.5"
                    />
                  ))}
                </svg>

                {/* Hit areas */}
                {Array.from({ length: rows }, (_, row) =>
                  Array.from({ length: cols }, (_, col) => (
                    <div
                      key={`${col},${row}`}
                      style={{
                        position: "absolute",
                        left: col * CELL,
                        top: row * CELL,
                        width: CELL,
                        height: CELL,
                        cursor: dragRef.current ? "grabbing" : "crosshair",
                        zIndex: 2,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, col, row)}
                      onMouseEnter={(e) => handleMouseEnter(e, col, row)}
                      onContextMenu={(e) => { e.preventDefault(); handleMouseDown(e, col, row); }}
                    />
                  ))
                )}

                {/* Rendered objects */}
                {objects.map((obj, i) => {
                  const w = obj.width * CELL;
                  const h = obj.height * CELL;
                  const bg = cellColor(obj);
                  const isBarrier = obj.objectType === "Barrier";
                  const isSpike = obj.objectType === "Hazard";
                  const isKillBrick = obj.objectType === "KillBrick";
                  const isDragging = dragRef.current?.obj === obj;

                  // Blending: suppress borders where same-type neighbor exists
                  const blendLeft = hasSameNeighbor(obj, "left");
                  const blendRight = hasSameNeighbor(obj, "right");
                  const blendTop = hasSameNeighbor(obj, "top");
                  const blendBottom = hasSameNeighbor(obj, "bottom");

                  const borderStyle = (side) => {
                    const blended = { left: blendLeft, right: blendRight, top: blendTop, bottom: blendBottom }[side];
                    return blended ? "none" : "1px solid rgba(0,0,0,0.2)";
                  };

                  // Extend by 1px in blended directions to ensure the SVG grid
                  // line is fully covered at sub-pixel boundaries.
                  const objTop  = isKillBrick ? obj.positionY * CELL + CELL / 2 : obj.positionY * CELL;
                  const objH    = isKillBrick ? CELL / 2 : h;

                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: obj.positionX * CELL,
                        top: objTop,
                        width:  w    + (blendRight  ? 1 : 0),
                        height: objH + (blendBottom ? 1 : 0),
                        background: bg,
                        opacity: isBarrier ? 0.7 : isDragging ? 0.5 : 1,
                        borderLeft:   borderStyle("left"),
                        borderRight:  borderStyle("right"),
                        borderTop:    isKillBrick ? "none" : borderStyle("top"),
                        borderBottom: borderStyle("bottom"),
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        pointerEvents: "none",
                        overflow: "hidden",
                        zIndex: 1,
                        boxShadow: isKillBrick ? "0 0 8px rgba(220,0,0,0.7)" : "none",
                      }}
                    >
                      {isSpike && w >= CELL && h >= CELL && (
                        <svg
                          width={CELL}
                          height={CELL}
                          style={{ position: "absolute", top: 0, left: 0 }}
                        >
                          <polygon
                            points={`2,${CELL} ${CELL / 2},2 ${CELL - 2},${CELL}`}
                            fill="#aaa"
                          />
                        </svg>
                      )}
                      <span style={styles.cellLabel}>{cellLabel(obj)}</span>
                    </div>
                  );
                })}

                {/* Drag ghost */}
                {ghostCell && dragRef.current && (
                  <div
                    style={{
                      position: "absolute",
                      left: ghostCell.col * CELL,
                      top: ghostCell.row * CELL,
                      width: dragRef.current.obj.width * CELL,
                      height: dragRef.current.obj.height * CELL,
                      background: cellColor(dragRef.current.obj),
                      opacity: 0.4,
                      border: "2px dashed rgba(0,0,0,0.4)",
                      boxSizing: "border-box",
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "#fff",
    borderRadius: "12px",
    width: "95vw",
    height: "95vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid #e8e8e8",
    background: "#fafafa",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerTitle: { fontWeight: "700", fontSize: "15px" },
  headerSub: { fontSize: "13px", color: "#555" },
  headerDim: {
    fontSize: "12px",
    color: "#aaa",
    background: "#f0f0f0",
    padding: "2px 8px",
    borderRadius: "99px",
  },
  headerActions: { display: "flex", alignItems: "center", gap: "8px" },
  saveMsg: { fontSize: "13px", fontWeight: "500" },
  btnSave: {
    padding: "7px 18px",
    background: "#185FA5",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnMeta: {
    padding: "5px 12px",
    background: "transparent",
    color: "#555",
    border: "1px solid #ddd",
    borderRadius: "7px",
    fontSize: "12px",
    cursor: "pointer",
  },
  btnPlayTest: {
    padding: "7px 18px",
    background: "#534AB7",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnClose: {
    padding: "7px 14px",
    background: "transparent",
    color: "#555",
    border: "1px solid #ddd",
    borderRadius: "7px",
    fontSize: "13px",
    cursor: "pointer",
  },
  metaBar: {
    borderBottom: "1px solid #e8e8e8",
    background: "#f8f9fa",
    padding: "12px 20px",
    flexShrink: 0,
  },
  metaFields: {
    display: "flex",
    alignItems: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
  },
  metaField: { display: "flex", flexDirection: "column", gap: "4px" },
  metaLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  metaInput: {
    padding: "6px 10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "13px",
    minWidth: "120px",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  sidebar: {
    width: "200px",
    flexShrink: 0,
    borderRight: "1px solid #e8e8e8",
    padding: "16px 14px",
    overflowY: "auto",
    background: "#fafafa",
  },
  sidebarSection: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: "7px",
  },
  typeList: { display: "flex", flexDirection: "column", gap: "3px" },
  typeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid transparent",
    background: "transparent",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    color: "#333",
  },
  typeBtnActive: {
    background: "#EEF4FF",
    border: "1px solid #D0DEFF",
    color: "#185FA5",
    fontWeight: "600",
  },
  typeDot: {
    width: "10px",
    height: "10px",
    borderRadius: "2px",
    flexShrink: 0,
  },
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "5px",
    marginBottom: "4px",
  },
  colorSwatch: {
    width: "28px",
    height: "28px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  colorLabel: { fontSize: "11px", color: "#888", marginTop: "2px" },
  staticValue: { fontSize: "13px", color: "#555", padding: "4px 0" },
  sizeRow: { display: "flex", gap: "8px" },
  sizeField: { display: "flex", alignItems: "center", gap: "5px" },
  sizeLabel: { fontSize: "12px", color: "#666", fontWeight: "600" },
  sizeInput: {
    width: "48px",
    padding: "4px 6px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "13px",
    textAlign: "center",
  },
  legend: { display: "flex", flexDirection: "column", gap: "5px" },
  legendRow: { display: "flex", alignItems: "center", gap: "7px" },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "2px",
    flexShrink: 0,
  },
  legendLabel: { fontSize: "12px", color: "#555" },
  hint: {
    fontSize: "10px",
    color: "#bbb",
    marginTop: "16px",
    lineHeight: 1.5,
  },
  gridWrapper: {
    flex: 1,
    overflow: "auto",
    padding: "20px",
    background: "#f5f5f5",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  gridSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  loadingText: { color: "#999", fontSize: "14px", margin: "auto" },
  cellLabel: {
    fontSize: "9px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    padding: "2px 3px",
    lineHeight: 1,
    pointerEvents: "none",
    position: "relative",
    zIndex: 1,
  },
};
