function About() {
  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>About CivicLens AI</h1>
        <p style={styles.subtitle}>
          A student-built grievance intelligence platform designed to improve
          complaint handling, prioritization, and accountability in institutions and governance systems.
        </p>
      </div>

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.heading}>Who We Are</h2>
          <p style={styles.text}>
            We are first-year B.Tech CSE students at DTU who built CivicLens AI
            to improve the grievance redressal experience in universities,
            municipal bodies such as MCDs, and eventually larger public
            governance systems in India.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.heading}>About the Project</h2>
          <p style={styles.text}>
            CivicLens AI is an AI-powered grievance intelligence platform that
            transforms raw complaints into structured administrative action.
            Instead of letting complaints remain scattered, delayed, or ignored,
            the system classifies them, assigns urgency, routes them to the right
            department, and provides a dashboard for faster decision-making.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.heading}>Working</h2>
          <ul style={styles.list}>
            <li>A user submits a complaint through the platform.</li>
            <li>The system analyzes the complaint using AI.</li>
            <li>It predicts category, urgency, and responsible department.</li>
            <li>The complaint is stored and shown on the admin dashboard.</li>
            <li>Authorities can track, update, and resolve cases systematically.</li>
          </ul>
        </section>

        <section style={styles.card}>
          <h2 style={styles.heading}>Vision</h2>
          <p style={styles.text}>
            Our vision is to build a smarter and more responsive grievance
            ecosystem for India — starting from campuses and local civic bodies,
            and extending toward more transparent and data-driven governance at a
            larger scale.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.heading}>Mission</h2>
          <p style={styles.text}>
            Our mission is to reduce complaint triage delays, improve routing
            accuracy, help authorities act faster, and ensure that genuine
            issues receive timely administrative attention.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.heading}>Why It Matters</h2>
          <p style={styles.text}>
            Many grievance systems still rely on manual review, scattered records,
            and delayed action. CivicLens AI aims to make grievance resolution
            more organized, scalable, and accountable, which can directly improve
            campus life, civic services, and citizen trust.
          </p>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f9fc",
    padding: "32px 24px 48px",
  },
  hero: {
    maxWidth: "1000px",
    margin: "0 auto 28px",
    textAlign: "center",
  },
  title: {
    fontSize: "2.6rem",
    marginBottom: "12px",
    color: "#111827",
  },
  subtitle: {
    color: "#4b5563",
    lineHeight: "1.7",
    fontSize: "1.05rem",
  },
  grid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  heading: {
    marginTop: 0,
    marginBottom: "12px",
    color: "#1f2937",
  },
  text: {
    margin: 0,
    lineHeight: "1.8",
    color: "#4b5563",
  },
  list: {
    margin: 0,
    paddingLeft: "20px",
    lineHeight: "1.9",
    color: "#4b5563",
  },
};

export default About;