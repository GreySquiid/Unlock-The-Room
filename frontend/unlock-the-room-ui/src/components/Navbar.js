import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (label, path) => (
    <button
      onClick={() => navigate(path)}
      style={{
        ...styles.navLink,
        ...(isActive(path) ? styles.navLinkActive : {}),
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.nav}>
      <span style={styles.brand}>Unlock The Room</span>
      <div style={styles.links}>
        {navLink("Dashboard", "/dashboard")}
        {navLink("Levels", "/levels")}
        {navLink("Reports", "/reports")}
        {navLink("AI Generator", "/ai-generator")}
      </div>
      <div style={styles.right}>
        {user.email && <span style={styles.userLabel}>{user.email}</span>}
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Log out
        </button>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    background: "var(--surface)",
    borderBottom: "1px solid var(--border-light)",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "52px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  brand: {
    fontWeight: "700",
    fontSize: "14px",
    letterSpacing: "0.2px",
    color: "var(--text)",
    flexShrink: 0,
  },
  links: { display: "flex", gap: "2px" },
  navLink: {
    fontSize: "13px",
    padding: "5px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    background: "transparent",
    border: "1px solid transparent",
    color: "var(--text-muted)",
    fontWeight: "400",
  },
  navLinkActive: {
    background: "var(--color-primary-bg)",
    border: "1px solid var(--color-primary-border)",
    color: "var(--color-primary)",
    fontWeight: "600",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  userLabel: {
    fontSize: "12px",
    color: "var(--text-subtle)",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    fontSize: "12px",
    padding: "5px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border-divider)",
    background: "transparent",
    color: "var(--text-muted)",
    cursor: "pointer",
  },
};

export default Navbar;
