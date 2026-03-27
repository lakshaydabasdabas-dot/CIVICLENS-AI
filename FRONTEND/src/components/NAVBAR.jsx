import { NavLink } from "react-router-dom";
import MagneticButton from "./MagneticButton";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Submit", to: "/submit" },
  { label: "Dashboard", to: "/dashboard" },
];

function Navbar() {
  return (
    <header className="site-header">
      <nav className="site-nav glass-panel">
        <NavLink
          to="/"
          className="site-brand"
          data-interactive="true"
          data-cursor-scale="1.3"
        >
          <span className="site-brand__mark" />
          <span>
            <strong>CivicLens AI</strong>
            <small>Interaction-grade governance UI</small>
          </span>
        </NavLink>

        <div className="site-nav__links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `site-nav__link ${isActive ? "site-nav__link--active" : ""}`.trim()
              }
              data-interactive="true"
              data-cursor-scale="1.22"
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <MagneticButton to="/submit" variant="secondary" className="site-nav__cta">
          Launch Intake
        </MagneticButton>
      </nav>
    </header>
  );
}

export default Navbar;
