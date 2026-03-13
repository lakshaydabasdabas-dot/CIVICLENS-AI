import { useState } from "react";
import { createComplaint, analyzeComplaint } from "../services/API.js";

function ComplaintForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState("");

  const handleAnalyze = async () => {
    try {
      const response = await analyzeComplaint({
        title,
        description,
        location,
      });

      setAnalysis(response.data);
      setMessage("AI analysis completed.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to analyze complaint.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await createComplaint({
        title,
        description,
        location,
        submitted_by: "Lakshay",
      });

      setMessage("Complaint submitted successfully.");
      console.log(response.data);

      setTitle("");
      setDescription("");
      setLocation("");
      setAnalysis(null);
    } catch (error) {
      console.error(error);
      setMessage("Failed to submit complaint.");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Complaint Title</label>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label style={styles.label}>Description</label>
        <textarea
          style={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label style={styles.label}>Location</label>
        <input
          style={styles.input}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div style={styles.buttonRow}>
          <button type="button" onClick={handleAnalyze} style={styles.analyzeBtn}>
            AI Analyze
          </button>

          <button type="submit" style={styles.submitBtn}>
            Submit Complaint
          </button>
        </div>
      </form>

      {analysis && (
        <div style={styles.analysisBox}>
          <h3>AI Analysis</h3>

          <p>
            <strong>Category:</strong> {analysis.category}
          </p>

          <p>
            <strong>Department:</strong> {analysis.department}
          </p>

          <p>
            <strong>Urgency:</strong> {analysis.urgency}
          </p>

          <p>
            <strong>Summary:</strong> {analysis.ai_summary}
          </p>
        </div>
      )}

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "0 auto",
  },

  form: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  label: {
    fontWeight: "600",
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  textarea: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    minHeight: "120px",
  },

  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "10px",
  },

  analyzeBtn: {
    background: "#6366f1",
    color: "white",
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  submitBtn: {
    background: "#16a34a",
    color: "white",
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  analysisBox: {
    marginTop: "24px",
    padding: "20px",
    background: "#f1f5f9",
    borderRadius: "10px",
  },

  message: {
    marginTop: "16px",
    textAlign: "center",
    color: "#2563eb",
  },
};

export default ComplaintForm;