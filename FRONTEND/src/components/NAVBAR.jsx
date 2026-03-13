import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>CivicLens AI</div>

      <div style={styles.links}>
        <Link
          to="/"
          style={{
            ...styles.link,
            ...(isActive("/") ? styles.activeLink : {}),
          }}
        >
          Home
        </Link>

        <Link
          to="/about"
          style={{
            ...styles.link,
            ...(isActive("/about") ? styles.activeLink : {}),
          }}
        >
          About
        </Link>

        <Link
          to="/submit"
          style={{
            ...styles.link,
            ...(isActive("/submit") ? styles.activeLink : {}),
          }}
        >
          Submit Complaint
        </Link>

        <Link
          to="/dashboard"
          style={{
            ...styles.link,
            ...(isActive("/dashboard") ? styles.activeLink : {}),
          }}
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 28px",
    background: "#111827",
    color: "#ffffff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
  },
  brand: {
    fontSize: "1.2rem",
    fontWeight: "700",
    letterSpacing: "0.3px",
  },
  links: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  link: {
    color: "#d1d5db",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "600",
  },
  activeLink: {
    background: "#2563eb",
    color: "#ffffff",
  },
};

export default Navbar;