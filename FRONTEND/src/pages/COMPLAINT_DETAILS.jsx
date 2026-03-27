import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MagneticButton from "../components/MagneticButton";
import SkeletonBlock from "../components/SkeletonBlock";
import { useComplaints } from "../context/useComplaints.js";
import { createPageAnimations } from "../interactions/animations";
import { getComplaintById, updateComplaintStatus } from "../services/API.js";

function ComplaintDetails() {
  const { id } = useParams();
  const pageRef = useRef(null);
  const { updateComplaint } = useComplaints();
  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [error, setError] = useState(null);
  const submittedEmail = complaint?.email || complaint?.submitted_by || "Not provided";
  const submittedByValue =
    complaint?.submitted_by && complaint.submitted_by !== complaint.email
      ? complaint.submitted_by
      : submittedEmail;

  // Debug: Log the ID from URL
  console.log("🔍 ComplaintDetails - ID from URL:", id);
  console.log("🔍 Current URL:", window.location.href);

  useEffect(() => createPageAnimations(pageRef.current), []);

  useEffect(() => {
    const loadComplaint = async () => {
      setIsLoading(true);
      setError(null);
      console.log("🔍 Loading complaint with ID:", id);

      try {
        console.log("🔍 Calling getComplaintById with ID:", id);
        const response = await getComplaintById(id);
        console.log("🔍 API Response status:", response.status);
        console.log("🔍 API Response data:", response.data);
        
        if (response.data) {
          setComplaint(response.data);
          setStatus(response.data.status);
          console.log("🔍 Complaint loaded successfully:", response.data.id);
        } else {
          console.error("🔍 No data in response");
          setError("No complaint data received");
          setMessage("Complaint not found.");
        }
      } catch (error) {
        console.error("🔍 Error loading complaint:", error);
        console.error("🔍 Error response:", error.response);
        console.error("🔍 Error message:", error.message);
        setError(error.message);
        setMessage("Failed to load complaint details.");
      } finally {
        setIsLoading(false);
        console.log("🔍 Loading complete, isLoading:", false);
      }
    };

    if (id) {
      loadComplaint();
    } else {
      console.log("🔍 No ID found in URL");
      setError("No complaint ID provided");
      setMessage("Please provide a complaint ID.");
      setIsLoading(false);
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    setIsSaving(true);
    setPendingStatus("manual");
    setMessage("");

    try {
      const response = await updateComplaintStatus(id, { status });
      setComplaint(response.data);
      updateComplaint(response.data);
      setMessage("Status updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update status.");
    } finally {
      setIsSaving(false);
      setPendingStatus("");
    }
  };

  const handleQuickStatusUpdate = async (nextStatus) => {
    setIsSaving(true);
    setPendingStatus(nextStatus);
    setMessage("");

    try {
      const response = await updateComplaintStatus(id, { status: nextStatus });
      setComplaint(response.data);
      setStatus(response.data.status);
      updateComplaint(response.data);
      setMessage(
        nextStatus === "in_progress"
          ? "Complaint marked as in progress."
          : "Complaint marked as resolved."
      );
    } catch (error) {
      console.error(error);
      setMessage("Failed to update status.");
    } finally {
      setIsSaving(false);
      setPendingStatus("");
    }
  };

  // Debug: Log current state
  console.log("🔍 Current state - isLoading:", isLoading, "complaint:", complaint, "error:", error);

  return (
    <div ref={pageRef} className="content-page">
      <section className="page-hero reveal-in">
        <span className="section-kicker">Complaint details</span>
        <h1 className="page-title gradient-reveal">
          Review the complaint record, AI fields, and resolution status.
        </h1>
      </section>

      {message ? (
        <p
          className={`form-message ${message.includes("Failed") ? "form-message--error" : ""}`.trim()}
        >
          {message}
        </p>
      ) : null}

      {error && (
        <div className="detail-card glass-panel">
          <div className="detail-grid">
            <div className="detail-item detail-item--wide">
              <span>Debug Info</span>
              <p>Error: {error}</p>
              <p>Complaint ID from URL: {id}</p>
              <p>Current URL: {window.location.href}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="detail-card glass-panel">
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-line skeleton-line--long" />
            <SkeletonBlock className="skeleton-line skeleton-line--medium" />
            <SkeletonBlock className="skeleton-card" />
            <SkeletonBlock className="skeleton-card" />
          </div>
        </div>
      ) : complaint ? (
        <div className="detail-card glass-panel reveal-in">
          <div className="detail-grid">
            <div className="detail-item">
              <span>ID</span>
              <strong>{complaint.id}</strong>
            </div>
            <div className="detail-item">
              <span>Title</span>
              <strong>{complaint.title}</strong>
            </div>
            <div className="detail-item detail-item--wide">
              <span>Description</span>
              <p>{complaint.description}</p>
            </div>
            <div className="detail-item">
              <span>Location</span>
              <strong>{complaint.location}</strong>
            </div>
            <div className="detail-item">
              <span>Category</span>
              <strong>{complaint.category}</strong>
            </div>
            <div className="detail-item">
              <span>Urgency</span>
              <strong>{complaint.urgency}</strong>
            </div>
            <div className="detail-item">
              <span>Department</span>
              <strong>{complaint.department}</strong>
            </div>
            <div className="detail-item">
              <span>Submitted by (Email)</span>
              <strong>{submittedEmail}</strong>
            </div>
            <div className="detail-item">
              <span>Submitted by</span>
              <strong>{submittedByValue}</strong>
            </div>
            <div className="detail-item detail-item--wide">
              <span>AI summary</span>
              <p>{complaint.ai_summary}</p>
            </div>
          </div>

          <div className="status-bar">
            <select
              className="field-input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            <MagneticButton
              variant="primary"
              onClick={handleStatusUpdate}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Update Status"}
            </MagneticButton>

            <MagneticButton
              variant="secondary"
              onClick={() => handleQuickStatusUpdate("in_progress")}
              disabled={isSaving || complaint.status === "IN_PROGRESS"}
            >
              {isSaving && pendingStatus === "in_progress" ? "Saving..." : "Mark as In Progress"}
            </MagneticButton>

            <MagneticButton
              variant="primary"
              onClick={() => handleQuickStatusUpdate("resolved")}
              disabled={isSaving || complaint.status === "RESOLVED"}
            >
              {isSaving && pendingStatus === "resolved" ? "Saving..." : "Mark as Resolved"}
            </MagneticButton>
          </div>
        </div>
      ) : (
        // Show when not loading but no complaint data
        <div className="detail-card glass-panel">
          <div className="detail-grid">
            <div className="detail-item detail-item--wide">
              <span>Complaint Not Found</span>
              <p>No complaint data available for ID: {id}</p>
              <p>Please check if the complaint exists or try a different ID.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintDetails;
