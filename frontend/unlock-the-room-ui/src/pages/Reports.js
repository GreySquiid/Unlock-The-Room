import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: "",
    isPublished: "",
    fromDate: "",
    toDate: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.isPublished !== "") params.isPublished = filters.isPublished;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      const res = await api.get("/Reports/levels", { params });
      setReport(res.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

  const difficultyColor = (d) => {
    if (d === "Easy") return styles.badgeGreen;
    if (d === "Medium") return styles.badgeAmber;
    if (d === "Hard") return styles.badgeRed;
    return styles.badgeGray;
  };

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Level inventory report</h1>
            {report && (
              <p style={styles.generatedAt}>
                Generated: {formatDate(report.generatedAt)}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleGenerate} style={styles.filterCard}>
          <p style={styles.filterTitle}>Report parameters</p>
          <div style={styles.filterGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Difficulty</label>
              <select
                style={styles.select}
                value={filters.difficulty}
                onChange={(e) =>
                  handleFilterChange("difficulty", e.target.value)
                }
              >
                <option value="">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Status</label>
              <select
                style={styles.select}
                value={filters.isPublished}
                onChange={(e) =>
                  handleFilterChange("isPublished", e.target.value)
                }
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>From date</label>
              <input
                style={styles.input}
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>To date</label>
              <input
                style={styles.input}
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
              />
            </div>
          </div>
          <button style={styles.primaryBtn} type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate report"}
          </button>
        </form>

        {report && (
          <>
            <div style={styles.statsGrid}>
              <StatCard label="Total levels" value={report.totalLevels} />
              <StatCard label="Published" value={report.publishedCount} />
              <StatCard label="Validated" value={report.validatedCount} />
              <StatCard label="Easy" value={report.easyCount} color="var(--color-success-text)" />
              <StatCard label="Medium" value={report.mediumCount} color="var(--color-warning-text)" />
              <StatCard label="Hard" value={report.hardCount} color="var(--color-danger-text)" />
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableHeader}>
                <p style={styles.tableTitle}>{report.reportTitle}</p>
                <p style={styles.tableSubtitle}>
                  {report.totalLevels} levels matching filters
                </p>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Difficulty</th>
                    <th style={styles.th}>Grid size</th>
                    <th style={styles.th}>Objects</th>
                    <th style={styles.th}>Scores</th>
                    <th style={styles.th}>Validated</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {report.levels.length === 0 && (
                    <tr>
                      <td colSpan={10} style={styles.empty}>
                        No levels match the selected filters.
                      </td>
                    </tr>
                  )}
                  {report.levels.map((level, idx) => (
                    <tr
                      key={level.id}
                      style={{ background: idx % 2 === 0 ? "var(--surface-raised)" : "var(--surface)" }}
                    >
                      <td style={styles.td}>{level.id}</td>
                      <td style={styles.td}>{level.name}</td>
                      <td style={styles.td}>
                        <span style={difficultyColor(level.difficulty)}>
                          {level.difficulty}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {level.rows} × {level.columns}
                      </td>
                      <td style={styles.td}>{level.gameObjectCount}</td>
                      <td style={styles.td}>{level.scoreCount}</td>
                      <td style={styles.td}>
                        {level.isValidated ? "Yes" : "No"}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            level.isPublished
                              ? styles.badgeGreen
                              : styles.badgeGray
                          }
                        >
                          {level.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(level.createdAt)}</td>
                      <td style={styles.td}>{formatDate(level.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, color: color || "var(--text)" }}>{value}</p>
    </div>
  );
}

const styles = {
  page: { padding: "2rem 2.5rem" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
  },
  title: { fontSize: "22px", fontWeight: "600", marginBottom: "4px" },
  generatedAt: { fontSize: "13px", color: "var(--text-dim)" },
  filterCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "1.25rem",
    marginBottom: "1.5rem",
  },
  filterTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    marginBottom: "12px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: "12px",
    marginBottom: "1rem",
  },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "12px", fontWeight: "500", color: "var(--text-muted)" },
  select: {
    padding: "7px 10px",
    border: "1px solid var(--border-divider)",
    borderRadius: "8px",
    fontSize: "13px",
    background: "var(--surface)",
  },
  input: {
    padding: "7px 10px",
    border: "1px solid var(--border-divider)",
    borderRadius: "8px",
    fontSize: "13px",
  },
  primaryBtn: {
    padding: "8px 20px",
    background: "var(--color-primary)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0,1fr))",
    gap: "10px",
    marginBottom: "1.5rem",
  },
  statCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "1rem",
  },
  statLabel: {
    fontSize: "11px",
    color: "var(--text-subtle)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: { fontSize: "26px", fontWeight: "600" },
  tableCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  tableHeader: { padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" },
  tableTitle: { fontSize: "15px", fontWeight: "600" },
  tableSubtitle: { fontSize: "12px", color: "var(--text-subtle)", marginTop: "2px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    color: "var(--text-dim)",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface-raised)",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid var(--bg-hover)",
    whiteSpace: "nowrap",
  },
  empty: { padding: "2rem", textAlign: "center", color: "var(--text-subtle)" },
  badgeGreen: {
    background: "var(--color-success-bg)",
    color: "var(--color-success-text)",
    padding: "2px 8px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "500",
  },
  badgeAmber: {
    background: "var(--color-warning-bg)",
    color: "var(--color-warning-text)",
    padding: "2px 8px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "500",
  },
  badgeRed: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger-text)",
    padding: "2px 8px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "500",
  },
  badgeGray: {
    background: "var(--bg-hover)",
    color: "var(--text-dim)",
    padding: "2px 8px",
    borderRadius: "99px",
    fontSize: "11px",
    fontWeight: "500",
  },
};

export default Reports;
