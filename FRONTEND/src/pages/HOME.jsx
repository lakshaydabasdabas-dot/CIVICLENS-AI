import { Link } from "react-router-dom";

function FeatureCard({ title, description, icon }) {
  return (
    <div
      style={{
        padding: "1.2rem",
        borderRadius: "22px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "16px",
          display: "grid",
          placeItems: "center",
          fontSize: "1.35rem",
          background: "rgba(255,255,255,0.08)",
          marginBottom: "0.9rem",
        }}
      >
        {icon}
      </div>
      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h3>
      <p
        style={{
          margin: "0.65rem 0 0",
          lineHeight: 1.7,
          opacity: 0.84,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function Home() {
  return (
    <div style={{ display: "grid", gap: "1.6rem" }}>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "30px",
          padding: "2rem",
          background:
            "radial-gradient(circle at top left, rgba(96,165,250,0.22), transparent 32%), radial-gradient(circle at bottom right, rgba(34,197,94,0.18), transparent 26%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.92))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "1.5rem",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.45rem 0.8rem",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: "0.88rem",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
            >
              <span>⚡</span>
              <span>Delhi Civic Intelligence Platform</span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2.25rem, 4vw, 3.7rem)",
                lineHeight: 1.1,
                fontWeight: 800,
                maxWidth: "760px",
              }}
            >
              CivicLens AI
            </h1>

            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "1.05rem",
                lineHeight: 1.85,
                opacity: 0.9,
                maxWidth: "760px",
              }}
            >
              Submit civic complaints, classify them automatically, detect duplicates,
              map civic hotspots across Delhi, and let citizens track their own
              complaint journey by username.
            </p>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                marginTop: "1.4rem",
              }}
            >
              <Link to="/submit" style={primaryButton}>
                Submit Complaint
              </Link>
              <Link to="/track" style={secondaryButton}>
                Track My Complaints
              </Link>
              <Link to="/dashboard" style={secondaryButton}>
                Explore Dashboard
              </Link>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            <InfoStrip label="Citizen feature" value="Track complaints by username" />
            <InfoStrip label="Operational feature" value="Priority-aware routing and hotspot analytics" />
            <InfoStrip label="Hackathon appeal" value="Map clusters, duplicate detection, smart triage" />
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "1rem",
        }}
      >
        <FeatureCard
          icon="🧠"
          title="AI Complaint Understanding"
          description="Automatically interprets complaint text, identifies the issue category, estimates urgency, and builds a structured summary."
        />
        <FeatureCard
          icon="📍"
          title="Location Intelligence"
          description="Captures and maps complaint locations to build Delhi-focused visibility for localities, repeated problem pockets, and region-level patterns."
        />
        <FeatureCard
          icon="🔁"
          title="Duplicate Detection"
          description="Finds repeated or highly similar complaints so multiple reports of the same issue can be grouped into stronger civic signals."
        />
        <FeatureCard
          icon="👤"
          title="Citizen Complaint Tracking"
          description="Lets users track their own complaints using a username-based flow without needing the wrong admin-style login restriction."
        />
      </section>
    </div>
  );
}

function InfoStrip({ label, value }) {
  return (
    <div
      style={{
        padding: "0.95rem 1rem",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: "0.85rem", opacity: 0.72 }}>{label}</div>
      <div style={{ marginTop: "0.25rem", fontSize: "1.05rem", fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

const primaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.95rem 1.2rem",
  borderRadius: "16px",
  textDecoration: "none",
  fontWeight: 800,
  color: "#0f172a",
  background: "#f8fafc",
  boxShadow: "0 10px 26px rgba(0,0,0,0.2)",
};

const secondaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.95rem 1.2rem",
  borderRadius: "16px",
  textDecoration: "none",
  fontWeight: 800,
  color: "#f8fafc",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
};

export default Home;