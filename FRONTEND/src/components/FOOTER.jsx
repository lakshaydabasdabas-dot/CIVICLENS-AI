import { Link } from "react-router-dom";

const footerLinks = [
  { label: "About", to: "/about" },
  { label: "Submit Complaint", to: "/submit" },
  { label: "Dashboard", to: "/dashboard" },
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__shell glass-panel reveal-in">
        <div>
          <p className="footer-kicker">CivicLens AI</p>
          <h2 className="footer-title">
            Designed to make grievance workflows legible, fast, and accountable.
          </h2>
        </div>

        <div className="site-footer__meta">
          <p className="footer-copy">
            Student-built at DTU for universities, civic bodies, and public systems
            that need better routing, prioritization, and operator-grade visibility.
          </p>

          <div className="site-footer__links">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-link"
                data-interactive="true"
                data-cursor-scale="1.2"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p className="footer-legal">© 2026 CivicLens AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
