import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <span style={styles.badge}>Digital Governance • AI Grievance Intelligence</span>
          <h1 style={styles.title}>CivicLens AI</h1>
          <p style={styles.subtitle}>
            An AI-powered grievance intelligence platform built to improve how
            complaints are understood, prioritized, routed, and resolved across
            universities, civic bodies, and public systems.
          </p>

          <div style={styles.buttonGroup}>
            <Link to="/submit" style={styles.primaryButton}>
              Submit Complaint
            </Link>

            <Link to="/dashboard" style={styles.secondaryButton}>
              Open Dashboard
            </Link>

            <Link to="/about" style={styles.ghostButton}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>About</h2>
          <p style={styles.sectionText}>
            We are first-year B.Tech CSE students at DTU, and we created
            CivicLens AI to strengthen grievance systems in universities,
            municipal bodies like MCDs, and eventually broader governance
            structures in India. Our idea is simple: real complaints should not
            get lost in scattered systems, delayed reviews, or poor routing.
          </p>
        </div>
      </section>

      <section style={styles.gridSection}>
        <div style={styles.infoCard}>
          <h3 style={styles.cardTitle}>Working</h3>
          <ul style={styles.list}>
            <li>Users submit complaints through the platform.</li>
            <li>AI analyzes the complaint text.</li>
            <li>The system predicts category, urgency, and department.</li>
            <li>Complaints are shown in an admin dashboard.</li>
            <li>Authorities can track and update resolution status.</li>
          </ul>
        </div>

        <div style={styles.infoCard}>
          <h3 style={styles.cardTitle}>Vision</h3>
          <p style={styles.cardText}>
            To create a more transparent, efficient, and data-driven grievance
            redressal ecosystem in India — beginning with university campuses
            and local civic institutions, and scaling toward larger public
            governance systems.
          </p>
        </div>

        <div style={styles.infoCard}>
          <h3 style={styles.cardTitle}>Mission</h3>
          <p style={styles.cardText}>
            To reduce complaint handling delays, improve prioritization,
            strengthen routing accuracy, and support faster, better-informed
            administrative action using AI.
          </p>
        </div>
      </section>

      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>What CivicLens AI Does</h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureBox}>
            <h4 style={styles.featureTitle}>Complaint Classification</h4>
            <p style={styles.featureText}>
              Automatically identifies the type of complaint from raw text input.
            </p>
          </div>

          <div style={styles.featureBox}>
            <h4 style={styles.featureTitle}>Urgency Scoring</h4>
            <p style={styles.featureText}>
              Assigns priority levels so serious complaints can be addressed faster.
            </p>
          </div>

          <div style={styles.featureBox}>
            <h4 style={styles.featureTitle}>Department Routing</h4>
            <p style={styles.featureText}>
              Routes complaints to the most relevant department automatically.
            </p>
          </div>

          <div style={styles.featureBox}>
            <h4 style={styles.featureTitle}>Dashboard Analytics</h4>
            <p style={styles.featureText}>
              Gives administrators a clear picture of complaint trends and workload.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #eef4ff 0%, #f7f9fc 45%, #f7f9fc 100%)",
  },
  hero: {
    padding: "80px 24px 60px",
  },
  heroContent: {
    maxWidth: "1000px",
    margin: "0 auto",
    textAlign: "center",
  },
  badge: {
    display: "inline-block",
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "8px 14px",
    borderRadius: "999px",
    fontWeight: "700",
    marginBottom: "18px",
    fontSize: "0.9rem",
  },
  title: {
    fontSize: "4rem",
    marginBottom: "16px",
    color: "#111827",
  },
  subtitle: {
    maxWidth: "900px",
    margin: "0 auto 30px",
    fontSize: "1.15rem",
    color: "#4b5563",
    lineHeight: "1.8",
  },
  buttonGroup: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryButton: {
    padding: "14px 24px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "10px",
    fontWeight: "700",
  },
  secondaryButton: {
    padding: "14px 24px",
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "10px",
    fontWeight: "700",
  },
  ghostButton: {
    padding: "14px 24px",
    background: "#ffffff",
    color: "#111827",
    textDecoration: "none",
    borderRadius: "10px",
    fontWeight: "700",
    border: "1px solid #d1d5db",
  },
  section: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "20px 24px 10px",
  },
  sectionHeader: {
    background: "#ffffff",
    padding: "26px",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: "16px",
    color: "#111827",
  },
  sectionText: {
    textAlign: "center",
    color: "#4b5563",
    lineHeight: "1.9",
    maxWidth: "950px",
    margin: "0 auto",
  },
  gridSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "26px 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  infoCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "12px",
    color: "#1f2937",
  },
  cardText: {
    margin: 0,
    color: "#4b5563",
    lineHeight: "1.8",
  },
  list: {
    margin: 0,
    paddingLeft: "18px",
    color: "#4b5563",
    lineHeight: "1.9",
  },
  featuresSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "10px 24px 50px",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },
  featureBox: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  featureTitle: {
    marginTop: 0,
    marginBottom: "10px",
    color: "#1f2937",
  },
  featureText: {
    margin: 0,
    color: "#4b5563",
    lineHeight: "1.7",
  },
};

export default Home;