import ComplaintForm from "../components/COMPLAINT_FORM";

function SubmitComplaint() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Submit Complaint</h1>
      <p style={styles.subtitle}>
        Enter complaint details and let CivicLens AI analyze and route the issue.
      </p>

      <ComplaintForm />
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f7f9fc",
  },
  title: {
    textAlign: "center",
    marginBottom: "12px",
    color: "#1f2937",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "24px",
    color: "#6b7280",
  },
};

export default SubmitComplaint;