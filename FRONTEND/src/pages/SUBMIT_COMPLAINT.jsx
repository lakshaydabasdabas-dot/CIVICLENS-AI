import ComplaintForm from "../components/COMPLAINT_FORM.jsx";

function SubmitComplaint() {
  return (
    <div style={{ display: "grid", gap: "1.4rem" }}>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "28px",
          padding: "1.7rem",
          background:
            "radial-gradient(circle at top right, rgba(96,165,250,0.18), transparent 28%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.92))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 16px 42px rgba(0,0,0,0.24)",
        }}
      >
        <div style={{ maxWidth: "860px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.8rem",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: "0.86rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            <span>📝</span>
            <span>Complaint Intake</span>
          </div>

          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 3rem)" }}>
            Submit a civic complaint with location-aware AI intake
          </h1>

          <p
            style={{
              margin: "0.9rem 0 0",
              lineHeight: 1.8,
              opacity: 0.9,
              fontSize: "1rem",
            }}
          >
            Enter the complaint details, select or confirm the Delhi location, and let
            CivicLens AI classify the issue, estimate urgency, detect duplicates, and
            prepare routing intelligence.
          </p>
        </div>
      </section>

      <ComplaintForm />
    </div>
  );
}

export default SubmitComplaint;