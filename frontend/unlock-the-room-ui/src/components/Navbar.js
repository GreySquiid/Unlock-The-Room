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

  const navLink = (label, path) => (
    <button
      onClick={() => navigate(path)}
      style={{
        ...styles.navLink,
        background: location.pathname === path ? "#fff" : "transparent",
        border:
          location.pathname === path
            ? "1px solid #ddd"
            : "1px solid transparent",
        fontWeight: location.pathname === path ? "500" : "400",
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
        <span style={styles.userLabel}>{user.email}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Log out
        </button>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    background: "#f0f0f0",
    borderBottom: "1px solid #ddd",
    padding: "10px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontWeight: "600", fontSize: "15px" },
  links: { display: "flex", gap: "4px" },
  navLink: {
    fontSize: "13px",
    padding: "5px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    background: "transparent",
  },
  right: { display: "flex", alignItems: "center", gap: "12px" },
  userLabel: { fontSize: "13px", color: "#666" },
  logoutBtn: {
    fontSize: "13px",
    padding: "5px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
  },
};

export default Navbar;
