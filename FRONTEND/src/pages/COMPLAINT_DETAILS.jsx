import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getComplaintById, updateComplaintStatus } from "../services/API.js";

function ComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadComplaint();
  }, [id]);

  const loadComplaint = async () => {
    try {
      const response = await getComplaintById(id);
      setComplaint(response.data);
      setStatus(response.data.status);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load complaint details.");
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await updateComplaintStatus(id, { status });
      setComplaint(response.data);
      setMessage("Status updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update status.");
    }
  };

  if (!complaint) {
    return <div style={styles.container}>Loading complaint details...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Complaint Details</h1>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.card}>
        <p><strong>ID:</strong> {complaint.id}</p>
        <p><strong>Title:</strong> {complaint.title}</p>
        <p><strong>Description:</strong> {complaint.description}</p>
        <p><strong>Location:</strong> {complaint.location}</p>
        <p><strong>Category:</strong> {complaint.category}</p>
        <p><strong>Urgency:</strong> {complaint.urgency}</p>
        <p><strong>Department:</strong> {complaint.department}</p>
        <p><strong>Status:</strong> {complaint.status}</p>
        <p><strong>AI Summary:</strong> {complaint.ai_summary}</p>

        <div style={styles.actions}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
            <option value="NEW">NEW</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <button onClick={handleStatusUpdate} style={styles.button}>
            Update Status
          </button>
        </div>
      </div>
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
    marginBottom: "24px",
  },
  message: {
    textAlign: "center",
    marginBottom: "16px",
    color: "#2563eb",
  },
  card: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    lineHeight: "1.8",
  },
  actions: {
    marginTop: "20px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  select: {
    padding: "10px",
    borderRadius: "8px",
  },
  button: {
    padding: "10px 16px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default ComplaintDetails;