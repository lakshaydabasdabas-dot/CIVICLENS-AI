function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <h3 style={styles.title}>CivicLens AI</h3>
        <p style={styles.text}>
          Built by first-year B.Tech CSE students at DTU to strengthen grievance
          resolution across universities, civic bodies, and public governance systems.
        </p>
        <p style={styles.copy}>© 2026 CivicLens AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "#111827",
    color: "#ffffff",
    marginTop: "40px",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "28px 24px",
    textAlign: "center",
  },
  title: {
    marginBottom: "10px",
    fontSize: "1.2rem",
  },
  text: {
    margin: "0 auto 10px",
    maxWidth: "820px",
    lineHeight: "1.7",
    color: "#d1d5db",
  },
  copy: {
    fontSize: "0.95rem",
    color: "#9ca3af",
    margin: 0,
  },
};

export default Footer;