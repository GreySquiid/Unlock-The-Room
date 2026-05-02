import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import LevelEditor from "../components/LevelEditor";
import api from "../services/api";

function Levels() {
  const [levels, setLevels] = useState([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [form, setForm] = useState({
    name: "",
    difficulty: "Easy",
    rows: 10,
    columns: 10,
  });
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({
    name: "",
    rows: "",
    columns: "",
  });
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderLevels, setReorderLevels] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [reorderSuccess, setReorderSuccess] = useState("");
  const [editingLayout, setEditingLayout] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchLevels();
  }, [search, difficulty]);

  // Return from playtest: reopen the editor for the level that was just playtested
  useEffect(() => {
    if (location.state?.reopenEditor) {
      setEditingLayout(location.state.reopenEditor);
      window.history.replaceState({}, "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLevels = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (difficulty) params.difficulty = difficulty;
      const res = await api.get("/Levels", { params });
      setLevels(res.data);
    } catch {
      navigate("/login");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = { name: "", rows: "", columns: "" };
    if (!form.name.trim()) errors.name = "Name is required.";
    else if (form.name.trim().length < 3) errors.name = "Name must be at least 3 characters.";
    if (!form.rows || form.rows < 5 || form.rows > 30)
      errors.rows = "Rows must be between 5 and 30.";
    if (!form.columns || form.columns < 5 || form.columns > 30)
      errors.columns = "Columns must be between 5 and 30.";
    if (errors.name || errors.rows || errors.columns) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingLevel) {
        await api.put(`/Levels/${editingLevel.id}`, {
          ...form,
          isPublished: editingLevel.isPublished,
        });
      } else {
        await api.post("/Levels", form);
      }
      setShowForm(false);
      setEditingLevel(null);
      setForm({ name: "", difficulty: "Easy", rows: 10, columns: 10 });
      fetchLevels();
    } catch {
      setError("Failed to save level. Please try again.");
    }
  };

  const togglePublish = async (level) => {
    await api.put(`/Levels/${level.id}`, {
      name: level.name,
      difficulty: level.difficulty,
      rows: level.rows,
      columns: level.columns,
      isPublished: !level.isPublished,
      isValidated: level.isValidated,
    });
    fetchLevels();
  };

  const toggleValidate = async (level) => {
    await api.put(`/Levels/${level.id}`, {
      name: level.name,
      difficulty: level.difficulty,
      rows: level.rows,
      columns: level.columns,
      isPublished: level.isPublished,
      isValidated: !level.isValidated,
    });
    fetchLevels();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this level?")) return;
    await api.delete(`/Levels/${id}`);
    fetchLevels();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLevel(null);
    setForm({ name: "", difficulty: "Easy", rows: 10, columns: 10 });
    setError("");
    setFormErrors({ name: "", rows: "", columns: "" });
  };

  const handleReorderToggle = () => {
    setReorderMode(true);
    setReorderLevels([...levels]);
    setOriginalOrder([...levels]);
    setShowForm(false);
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) {
      setDragOverIndex(null);
      return;
    }
    const updated = [...reorderLevels];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setReorderLevels(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveOrder = async () => {
    try {
      await api.put("/Levels/reorder", {
        levelIds: reorderLevels.map((l) => l.id),
      });
      setLevels(reorderLevels);
      setReorderSuccess("Level order saved.");
      setTimeout(() => {
        setReorderSuccess("");
        setReorderMode(false);
      }, 1500);
    } catch {
      setReorderSuccess("");
    }
  };

  const handleCancelReorder = () => {
    setReorderLevels([...originalOrder]);
    setReorderMode(false);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>Level management</h1>
          {reorderMode ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {reorderSuccess && (
                <span style={styles.reorderSuccess}>{reorderSuccess}</span>
              )}
              <button style={styles.primaryBtn} onClick={handleSaveOrder}>
                Save order
              </button>
              <button style={styles.cancelBtn} onClick={handleCancelReorder}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={styles.secondaryBtn} onClick={handleReorderToggle}>
                Reorder levels
              </button>
              <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
                + New level
              </button>
            </div>
          )}
        </div>

        {!reorderMode && <div style={styles.toolbar}>
          <input
            style={styles.search}
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={styles.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>}

        {!reorderMode && showForm && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>
              {editingLevel ? "Edit level" : "New level"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Name</label>
                  <input
                    style={{
                      ...styles.input,
                      ...(formErrors.name ? { borderColor: "var(--color-danger)" } : {}),
                    }}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (formErrors.name)
                        setFormErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    required
                  />
                  {formErrors.name && (
                    <p style={{ color: "var(--color-danger)", fontSize: "12px", marginTop: "4px" }}>
                      {formErrors.name}
                    </p>
                  )}
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
                <div style={styles.field}>
                  <label style={styles.label}>Rows</label>
                  <input
                    style={{
                      ...styles.input,
                      ...(formErrors.rows ? { borderColor: "var(--color-danger)" } : {}),
                    }}
                    type="number"
                    min="5"
                    max="30"
                    value={form.rows}
                    onChange={(e) => {
                      setForm({ ...form, rows: parseInt(e.target.value) });
                      if (formErrors.rows)
                        setFormErrors((prev) => ({ ...prev, rows: "" }));
                    }}
                    required
                  />
                  {formErrors.rows && (
                    <p style={{ color: "var(--color-danger)", fontSize: "12px", marginTop: "4px" }}>
                      {formErrors.rows}
                    </p>
                  )}
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Columns</label>
                  <input
                    style={{
                      ...styles.input,
                      ...(formErrors.columns ? { borderColor: "var(--color-danger)" } : {}),
                    }}
                    type="number"
                    min="5"
                    max="30"
                    value={form.columns}
                    onChange={(e) => {
                      setForm({ ...form, columns: parseInt(e.target.value) });
                      if (formErrors.columns)
                        setFormErrors((prev) => ({ ...prev, columns: "" }));
                    }}
                    required
                  />
                  {formErrors.columns && (
                    <p style={{ color: "var(--color-danger)", fontSize: "12px", marginTop: "4px" }}>
                      {formErrors.columns}
                    </p>
                  )}
                </div>
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <div style={styles.formActions}>
                <button style={styles.primaryBtn} type="submit">
                  {editingLevel ? "Save changes" : "Create level"}
                </button>
                <button
                  style={styles.cancelBtn}
                  type="button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {reorderMode && (
          <div style={styles.reorderList}>
            {reorderLevels.map((level, index) => (
              <div
                key={level.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                style={{
                  ...styles.reorderRow,
                  ...(dragOverIndex === index ? styles.reorderRowOver : {}),
                  opacity: dragIndex === index ? 0.4 : 1,
                }}
              >
                <span style={styles.dragHandle}>⠿</span>
                <span style={styles.reorderName}>{level.name}</span>
                <span
                  style={
                    level.difficulty === "Hard"
                      ? styles.badgeRed
                      : level.difficulty === "Medium"
                      ? styles.badgeAmber
                      : styles.badgeGreen
                  }
                >
                  {level.difficulty}
                </span>
                <span style={styles.reorderGrid}>
                  {level.rows} × {level.columns}
                </span>
              </div>
            ))}
          </div>
        )}

        {editingLayout && (
          <LevelEditor
            level={editingLayout}
            onClose={() => { setEditingLayout(null); fetchLevels(); }}
            onPlayTest={(lvl) => {
              setEditingLayout(null);
              navigate("/play", { state: { autoPlay: lvl, from: "level-editor" } });
            }}
          />
        )}

        {!reorderMode && levels.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptySquid}>
              <div style={{ width: 48, height: 60, overflow: "hidden", imageRendering: "pixelated" }}>
                <img
                  src="/assets/squid-sprite.png"
                  alt=""
                  style={{ width: 192, height: 60, display: "block", imageRendering: "pixelated" }}
                />
              </div>
            </div>
            <p style={styles.emptyMsg}>No levels match your search.</p>
            <p style={styles.emptySub}>Try a different name or clear the filters.</p>
          </div>
        )}

        {!reorderMode && levels.length > 0 && <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Difficulty</th>
              <th style={styles.th}>Grid</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => (
              <tr key={level.id}>
                <td style={styles.td}>{level.name}</td>
                <td style={styles.td}>{level.difficulty}</td>
                <td style={styles.td}>
                  {level.rows} × {level.columns}
                </td>
                <td style={styles.td}>
                  <span
                    style={
                      level.isPublished ? styles.badgeGreen : styles.badgeGray
                    }
                  >
                    {level.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(level.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <KebabMenu
                    level={level}
                    openId={openMenuId}
                    setOpenId={setOpenMenuId}
                    onEdit={() => setEditingLayout(level)}
                    onPublish={() => togglePublish(level)}
                    onValidate={() => toggleValidate(level)}
                    onDelete={() => handleDelete(level.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "2rem 2.5rem" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: { fontSize: "22px", fontWeight: "600" },
  toolbar: { display: "flex", gap: "10px", marginBottom: "1.5rem" },
  search: {
    flex: 1,
    maxWidth: "320px",
    padding: "8px 12px",
    border: "1px solid var(--border-divider)",
    borderRadius: "8px",
    fontSize: "14px",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid var(--border-divider)",
    borderRadius: "8px",
    fontSize: "14px",
    background: "var(--surface)",
  },
  formCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  formTitle: { fontSize: "16px", fontWeight: "600", marginBottom: "1rem" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: "12px",
    marginBottom: "1rem",
  },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "13px", fontWeight: "500" },
  input: {
    padding: "8px 12px",
    border: "1px solid var(--border-divider)",
    borderRadius: "8px",
    fontSize: "14px",
  },
  formActions: { display: "flex", gap: "10px" },
  error: { color: "var(--color-danger)", fontSize: "13px", marginBottom: "10px" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "var(--surface)",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    overflow: "hidden",
  },
  th: {
    textAlign: "left",
    padding: "10px 16px",
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--text-dim)",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface-raised)",
  },
  td: {
    padding: "10px 16px",
    fontSize: "13px",
    borderBottom: "1px solid var(--bg-hover)",
  },
  emptyState: {
    padding: "3rem 2rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  emptySquid: { marginBottom: "4px" },
  emptyMsg: { fontSize: "15px", fontWeight: "600", color: "var(--text)", margin: 0 },
  emptySub: { fontSize: "13px", color: "var(--text-subtle)", margin: 0 },
  badgeGreen: {
    background: "var(--color-success-bg)",
    color: "var(--color-success-text)",
    padding: "2px 10px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "500",
  },
  badgeGray: {
    background: "var(--bg-hover)",
    color: "var(--text-dim)",
    padding: "2px 10px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "500",
  },
  primaryBtn: {
    padding: "8px 16px",
    background: "var(--color-primary)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "8px 16px",
    background: "var(--surface)",
    color: "var(--color-primary)",
    border: "1px solid var(--color-primary)",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "8px 16px",
    background: "var(--surface)",
    color: "var(--text-strong)",
    border: "1px solid var(--border-divider)",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
  reorderList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "1.5rem",
  },
  reorderRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "var(--surface-subtle)",
    border: "1px solid var(--border)",
    borderLeft: "4px solid var(--color-primary)",
    borderRadius: "8px",
    cursor: "grab",
    userSelect: "none",
  },
  reorderRowOver: {
    background: "var(--color-primary-bg)",
    borderLeft: "4px solid var(--color-primary-hover)",
    borderColor: "var(--color-primary)",
  },
  dragHandle: {
    fontSize: "18px",
    color: "var(--text-placeholder)",
    lineHeight: 1,
  },
  reorderName: {
    flex: 1,
    fontSize: "14px",
    fontWeight: "500",
  },
  reorderGrid: {
    fontSize: "13px",
    color: "var(--text-dim)",
  },
  reorderSuccess: {
    fontSize: "13px",
    color: "var(--color-success-text)",
    fontWeight: "500",
  },
  badgeRed: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger-text)",
    padding: "2px 10px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "500",
  },
  badgeAmber: {
    background: "var(--color-warning-bg)",
    color: "var(--color-warning-text)",
    padding: "2px 10px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "500",
  },
};

function KebabMenu({ level, openId, setOpenId, onEdit, onPublish, onValidate, onDelete }) {
  const isOpen = openId === level.id;
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  // Compute fixed position when menu opens so overflow:hidden on the table doesn't clip it
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
  }, [isOpen]);

  // Auto-focus first item
  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.querySelector('[role="menuitem"]')?.focus();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setOpenId(null);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setOpenId]);

  // Close on scroll (fixed dropdown would drift otherwise)
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setOpenId(null);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, { capture: true });
  }, [isOpen, setOpenId]);

  const items = [
    { label: "Edit", action: onEdit, color: "var(--color-primary)" },
    {
      label: level.isPublished ? "Unpublish" : "Publish",
      action: onPublish,
      color: level.isPublished ? "var(--color-warning-text)" : "var(--color-success-text)",
    },
    {
      label: level.isValidated ? "Invalidate" : "Validate",
      action: onValidate,
      color: "var(--text-dim)",
    },
    { label: "Delete", action: onDelete, color: "var(--color-danger)" },
  ];

  const handleItemKey = (e, idx) => {
    const all = menuRef.current?.querySelectorAll('[role="menuitem"]');
    if (e.key === "Escape") {
      setOpenId(null);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      all?.[Math.min(idx + 1, all.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx === 0) triggerRef.current?.focus();
      else all?.[idx - 1]?.focus();
    }
  };

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={triggerRef}
        style={kebabStyles.trigger}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Level actions"
        onClick={() => setOpenId(isOpen ? null : level.id)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpenId(null);
          if (e.key === "ArrowDown" && isOpen) {
            e.preventDefault();
            menuRef.current?.querySelector('[role="menuitem"]')?.focus();
          }
        }}
      >
        ⋯
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          style={{ ...kebabStyles.dropdown, top: pos.top, right: pos.right }}
        >
          {items.map((item, idx) => (
            <button
              key={item.label}
              role="menuitem"
              tabIndex={-1}
              style={{ ...kebabStyles.item, color: item.color }}
              onClick={() => { setOpenId(null); item.action(); }}
              onKeyDown={(e) => handleItemKey(e, idx)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

const kebabStyles = {
  trigger: {
    fontSize: "15px",
    padding: "2px 10px",
    borderRadius: "6px",
    border: "1px solid var(--border-divider)",
    background: "transparent",
    cursor: "pointer",
    color: "var(--text-dim)",
    letterSpacing: "3px",
    lineHeight: 1,
    fontWeight: "700",
  },
  dropdown: {
    position: "fixed",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.14)",
    zIndex: 1000,
    minWidth: "148px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  item: {
    textAlign: "left",
    padding: "9px 14px",
    fontSize: "13px",
    border: "none",
    borderBottom: "1px solid var(--bg-hover)",
    background: "transparent",
    cursor: "pointer",
    width: "100%",
  },
};

export default Levels;
