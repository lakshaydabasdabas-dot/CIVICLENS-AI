import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MagneticButton from "../components/MagneticButton";
import SkeletonBlock from "../components/SkeletonBlock";
import { createPageAnimations } from "../interactions/animations";
import { getComplaintById, updateComplaintStatus } from "../services/API.js";

function DetailCard({ label, value }) {
  return (
    <div
      style={{
        padding: "0.9rem",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: "0.35rem" }}>
        {label}
      </div>
      <div style={{ fontWeight: 700 }}>{value || "N/A"}</div>
    </div>
  );
}

function ComplaintDetails() {
  const { id } = useParams();
  const pageRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    createPageAnimations(pageRef.current);
  }, []);

  useEffect(() => {
    const loadComplaint = async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const response = await getComplaintById(id);
        setComplaint(response.data);
        setStatus(response.data.status);
      } catch (error) {
        console.error(error);
        setMessage("Failed to load complaint details.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadComplaint();
  }, [id]);

  const handleStatusUpdate = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await updateComplaintStatus(id, status);
      setComplaint(response.data);
      setStatus(response.data.status);
      setMessage("Status updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      ref={pageRef}
      style={{
        display: "grid",
        gap: "1.25rem",
      }}
    >
      <header
        style={{
          padding: "1rem",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontSize: "0.9rem", opacity: 0.78, marginBottom: "0.35rem" }}>
          Complaint details
        </div>
        <h1 style={{ margin: 0 }}>Review complaint intelligence</h1>
        <p style={{ marginTop: "0.45rem", opacity: 0.8 }}>
          Inspect structured fields, duplicate metadata, routing details, and update
          lifecycle status.
        </p>
      </header>

      {message ? (
        <div
          style={{
            padding: "0.95rem 1rem",
            borderRadius: "14px",
            background: message.toLowerCase().includes("failed")
              ? "rgba(239,68,68,0.12)"
              : "rgba(34,197,94,0.12)",
            border: message.toLowerCase().includes("failed")
              ? "1px solid rgba(239,68,68,0.24)"
              : "1px solid rgba(34,197,94,0.24)",
          }}
        >
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            padding: "1rem",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <SkeletonBlock className="skeleton-line skeleton-line--long" />
          <SkeletonBlock className="skeleton-line skeleton-line--short" />
          <SkeletonBlock className="skeleton-card" />
          <SkeletonBlock className="skeleton-card" />
        </div>
      ) : complaint ? (
        <>
          <section
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <DetailCard label="Complaint ID" value={complaint.id} />
            <DetailCard label="Status" value={complaint.status} />
            <DetailCard label="Category" value={complaint.category} />
            <DetailCard label="Urgency" value={complaint.urgency} />
            <DetailCard label="Priority score" value={complaint.priority_score} />
            <DetailCard label="Department" value={complaint.department} />
            <DetailCard label="Region" value={complaint.region} />
            <DetailCard label="Locality" value={complaint.locality} />
            <DetailCard label="District" value={complaint.district} />
            <DetailCard label="Model confidence" value={complaint.model_confidence} />
            <DetailCard label="Duplicate of" value={complaint.duplicate_of} />
            <DetailCard
              label="Similarity score"
              value={complaint.similarity_score}
            />
          </section>

          <section
            style={{
              display: "grid",
              gap: "1rem",
              padding: "1rem",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.9rem", opacity: 0.78 }}>Title</div>
              <h2 style={{ margin: "0.3rem 0 0" }}>{complaint.title}</h2>
            </div>

            <div>
              <div style={{ fontSize: "0.9rem", opacity: 0.78, marginBottom: "0.4rem" }}>
                Description
              </div>
              <div style={{ lineHeight: 1.7 }}>{complaint.description}</div>
            </div>

            <div>
              <div style={{ fontSize: "0.9rem", opacity: 0.78, marginBottom: "0.4rem" }}>
                AI summary
              </div>
              <div style={{ lineHeight: 1.7 }}>{complaint.ai_summary || "N/A"}</div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "0.8rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <DetailCard label="Location" value={complaint.location} />
              <DetailCard label="Formatted address" value={complaint.formatted_address} />
              <DetailCard label="Normalized location" value={complaint.normalized_location} />
              <DetailCard label="Latitude" value={complaint.lat} />
              <DetailCard label="Longitude" value={complaint.lng} />
              <DetailCard label="Submitted by" value={complaint.submitted_by} />
              <DetailCard label="Duplicate cluster" value={complaint.duplicate_cluster_id} />
              <DetailCard label="Created at" value={complaint.created_at} />
              <DetailCard label="Updated at" value={complaint.updated_at} />
              <DetailCard label="Resolved at" value={complaint.resolved_at} />
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gap: "1rem",
              padding: "1rem",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Update complaint status</h3>
              <p style={{ marginTop: "0.45rem", opacity: 0.8 }}>
                Move the complaint through the admin workflow.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "inherit",
                }}
              >
                <option value="NEW">NEW</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>

              <MagneticButton
                variant="primary"
                onClick={handleStatusUpdate}
                magnetic={!isSaving}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Update Status"}
              </MagneticButton>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default ComplaintDetails;