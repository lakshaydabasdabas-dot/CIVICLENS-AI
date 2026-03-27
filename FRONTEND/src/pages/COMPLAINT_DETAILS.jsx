import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getComplaintById, updateComplaintStatus } from "../services/API.js";

function ComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("NEW");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setMessage("");

      try {
        const data = await getComplaintById(id);
        if (!active) return;
        setComplaint(data);
        setStatus(data.status || "NEW");
      } catch (err) {
        console.error(err);
        if (active) setMessage("Failed to load complaint details.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    setMessage("");

    try {
      const updated = await updateComplaintStatus(id, status);
      setComplaint(updated);
      setMessage("Status updated successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ opacity: 0.8 }}>Loading complaint details...</p>;
  }

  if (!complaint) {
    return <p style={{ opacity: 0.8 }}>Complaint not found.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section
        style={{
          padding: "1.2rem",
          borderRadius: "22px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontSize: "0.9rem", opacity: 0.78 }}>Complaint details</div>
        <h1 style={{ margin: "0.35rem 0 0" }}>{complaint.title}</h1>
      </section>

      {message ? (
        <div
          style={{
            padding: "0.95rem 1rem",
            borderRadius: "14px",
            background: message.toLowerCase().includes("fail")
              ? "rgba(239,68,68,0.12)"
              : "rgba(34,197,94,0.12)",
            border: message.toLowerCase().includes("fail")
              ? "1px solid rgba(239,68,68,0.24)"
              : "1px solid rgba(34,197,94,0.24)",
          }}
        >
          {message}
        </div>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <Detail label="ID" value={complaint.id} />
        <Detail label="Status" value={complaint.status} />
        <Detail label="Category" value={complaint.category} />
        <Detail label="Urgency" value={complaint.urgency} />
        <Detail label="Priority score" value={complaint.priority_score} />
        <Detail label="Department" value={complaint.department} />
        <Detail label="Region" value={complaint.region} />
        <Detail label="Locality" value={complaint.locality} />
      </section>

      <section
        style={{
          padding: "1rem",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Description</h3>
        <p style={{ margin: 0, lineHeight: 1.7 }}>{complaint.description}</p>

        <h3 style={{ marginBottom: "0.4rem", marginTop: "1rem" }}>AI summary</h3>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          {complaint.ai_summary || "No summary available."}
        </p>
      </section>

      <section
        style={{
          padding: "1rem",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gap: "0.8rem",
        }}
      >
        <h3 style={{ margin: 0 }}>Update complaint status</h3>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            maxWidth: "240px",
          }}
        >
          <option value="NEW">NEW</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>

        <button
          type="button"
          disabled={saving}
          onClick={handleUpdate}
          style={{
            width: "fit-content",
            padding: "0.9rem 1rem",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {saving ? "Saving..." : "Update Status"}
        </button>
      </section>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div
      style={{
        padding: "0.95rem 1rem",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ opacity: 0.74, fontSize: "0.88rem" }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>{value ?? "N/A"}</div>
    </div>
  );
}

export default ComplaintDetails;