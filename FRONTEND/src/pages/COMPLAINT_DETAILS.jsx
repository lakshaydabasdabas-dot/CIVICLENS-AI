import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MagneticButton from "../components/MagneticButton";
import SkeletonBlock from "../components/SkeletonBlock";
import { createPageAnimations } from "../interactions/animations";
import { getComplaintById, updateComplaintStatus } from "../services/API.js";

function ComplaintDetails() {
  const { id } = useParams();
  const pageRef = useRef(null);
  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => createPageAnimations(pageRef.current), []);

  useEffect(() => {
    const loadComplaint = async () => {
      setIsLoading(true);

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

    loadComplaint();
  }, [id]);

  const handleStatusUpdate = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await updateComplaintStatus(id, { status });
      setComplaint(response.data);
      setMessage("Status updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  };

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
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ComplaintDetails;
